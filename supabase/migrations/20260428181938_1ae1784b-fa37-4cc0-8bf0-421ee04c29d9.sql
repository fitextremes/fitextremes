
-- ============================================================
-- 1. PLANS CATALOG
-- ============================================================
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('trial','monthly','annual','custom','lifetime')),
  trial_days integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_default_trial boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans readable by everyone"
ON public.subscription_plans FOR SELECT USING (true);

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.subscription_plans
  (code, name, description, price_cents, currency, billing_cycle, trial_days, is_default_trial, sort_order)
VALUES
  ('trial',    'Free Trial',     '1 month free for new trainers',          0,     'USD', 'trial',   30, true,  0),
  ('monthly',  'Monthly',        'Billed monthly',                         2900,  'USD', 'monthly',  0, false, 1),
  ('pro',      'Pro Monthly',    'Pro tools & priority listing',           5900,  'USD', 'monthly',  0, false, 2),
  ('annual',   'Annual',         'Best value — 2 months free',             29900, 'USD', 'annual',   0, false, 3),
  ('enterprise','Enterprise',    'Custom pricing for studios & teams',     0,     'USD', 'custom',   0, false, 4);

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL CHECK (status IN (
    'trial','trial_ending','active','payment_due','grace','expired','cancelled','paused','lifetime'
  )),
  billing_cycle text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  next_billing_date timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_used boolean NOT NULL DEFAULT false,
  payment_provider text NOT NULL DEFAULT 'mock',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX subscriptions_one_per_trainer ON public.subscriptions(trainer_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_next_billing_idx ON public.subscriptions(next_billing_date);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainer reads own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = trainer_id);

-- writes go through SECURITY DEFINER functions only
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. EVENT LOG
-- ============================================================
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'trial_started','trial_ending_soon','trial_ended',
    'subscribed','renewed','payment_failed','payment_succeeded',
    'cancel_requested','cancelled','reactivated','expired',
    'plan_changed','paused','resumed'
  )),
  from_status text,
  to_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainer reads own subscription events"
ON public.subscription_events FOR SELECT
USING (auth.uid() = trainer_id);

CREATE INDEX subscription_events_trainer_idx ON public.subscription_events(trainer_id, created_at DESC);

-- ============================================================
-- 4. NOTIFICATIONS — extend allowed types via constraint-free text column (already text, no enum)
--    No schema change needed; we'll insert subscription_* notification types.
-- ============================================================

-- ============================================================
-- 5. NEW USER TRIGGER — auto-create trial subscription for trainers
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_trainer_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trial public.subscription_plans;
BEGIN
  IF NEW.role <> 'trainer' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE trainer_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _trial FROM public.subscription_plans WHERE is_default_trial = true LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  INSERT INTO public.subscriptions (
    trainer_id, plan_id, status, billing_cycle, price_cents, currency,
    start_date, end_date, next_billing_date, trial_used
  ) VALUES (
    NEW.id, _trial.id, 'trial', 'trial', 0, _trial.currency,
    now(), now() + (_trial.trial_days || ' days')::interval,
    now() + (_trial.trial_days || ' days')::interval, true
  );

  INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, to_status)
  SELECT NEW.id, s.id, 'trial_started', 'trial'
  FROM public.subscriptions s WHERE s.trainer_id = NEW.id;

  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (NEW.id, NULL, 'subscription_trial_started');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_trainer_trial ON public.profiles;
CREATE TRIGGER trg_profiles_trainer_trial
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_trainer_subscription();

-- backfill existing trainers without a subscription
INSERT INTO public.subscriptions (trainer_id, plan_id, status, billing_cycle, price_cents, currency, start_date, end_date, next_billing_date, trial_used)
SELECT p.id,
       (SELECT id FROM public.subscription_plans WHERE is_default_trial = true),
       'trial', 'trial', 0, 'USD',
       COALESCE(p.trial_started_at, now()),
       COALESCE(p.trial_started_at, now()) + interval '30 days',
       COALESCE(p.trial_started_at, now()) + interval '30 days',
       true
FROM public.profiles p
WHERE p.role = 'trainer'
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.trainer_id = p.id);

-- ============================================================
-- 6. RPCs
-- ============================================================

-- subscribe to a plan (mock billing — instantly active)
CREATE OR REPLACE FUNCTION public.subscribe_to_plan(_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _plan public.subscription_plans;
  _sub public.subscriptions;
  _period interval;
  _new_end timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO _plan FROM public.subscription_plans WHERE code = _plan_code AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  END IF;

  IF _plan.billing_cycle = 'custom' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'contact_sales');
  END IF;

  _period := CASE _plan.billing_cycle
    WHEN 'monthly' THEN interval '30 days'
    WHEN 'annual'  THEN interval '365 days'
    WHEN 'trial'   THEN (_plan.trial_days || ' days')::interval
    ELSE interval '30 days'
  END;

  _new_end := now() + _period;

  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;

  IF FOUND THEN
    UPDATE public.subscriptions
    SET plan_id = _plan.id,
        status = CASE WHEN _plan.billing_cycle = 'trial' THEN 'trial' ELSE 'active' END,
        billing_cycle = _plan.billing_cycle,
        price_cents = _plan.price_cents,
        currency = _plan.currency,
        start_date = now(),
        end_date = _new_end,
        next_billing_date = _new_end,
        cancel_at_period_end = false
    WHERE id = _sub.id;
  ELSE
    INSERT INTO public.subscriptions (trainer_id, plan_id, status, billing_cycle, price_cents, currency, start_date, end_date, next_billing_date)
    VALUES (_uid, _plan.id,
            CASE WHEN _plan.billing_cycle = 'trial' THEN 'trial' ELSE 'active' END,
            _plan.billing_cycle, _plan.price_cents, _plan.currency, now(), _new_end, _new_end)
    RETURNING * INTO _sub;
  END IF;

  INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, to_status, metadata)
  VALUES (_uid, _sub.id, 'subscribed', 'active', jsonb_build_object('plan', _plan.code));

  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (_uid, NULL, 'subscription_activated');

  RETURN jsonb_build_object('ok', true, 'plan', _plan.code, 'next_billing_date', _new_end);
END;
$$;

-- cancel: keep access until end_date
CREATE OR REPLACE FUNCTION public.cancel_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _sub public.subscriptions;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason','unauthenticated'); END IF;

  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason','no_subscription'); END IF;

  UPDATE public.subscriptions
  SET cancel_at_period_end = true
  WHERE id = _sub.id;

  INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, to_status)
  VALUES (_uid, _sub.id, 'cancel_requested', _sub.status);

  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (_uid, NULL, 'subscription_cancel_scheduled');

  RETURN jsonb_build_object('ok', true, 'access_until', _sub.end_date);
END;
$$;

-- reactivate: clear cancel flag, or re-subscribe
CREATE OR REPLACE FUNCTION public.reactivate_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _sub public.subscriptions;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','unauthenticated'); END IF;

  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','no_subscription'); END IF;

  IF _sub.status IN ('expired','cancelled') THEN
    RETURN jsonb_build_object('ok', false, 'reason','choose_plan');
  END IF;

  UPDATE public.subscriptions
  SET cancel_at_period_end = false
  WHERE id = _sub.id;

  INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, to_status)
  VALUES (_uid, _sub.id, 'reactivated', _sub.status);

  INSERT INTO public.notifications (recipient_id, actor_id, type)
  VALUES (_uid, NULL, 'subscription_reactivated');

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- recompute one trainer's status (idempotent; safe to call on every dashboard load)
CREATE OR REPLACE FUNCTION public.recompute_subscription_status(_trainer_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := COALESCE(_trainer_id, auth.uid());
  _sub public.subscriptions;
  _new_status text;
  _days_left numeric;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;

  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','no_subscription'); END IF;

  IF _sub.status = 'lifetime' THEN
    RETURN jsonb_build_object('ok',true,'status','lifetime');
  END IF;

  _days_left := EXTRACT(EPOCH FROM (_sub.end_date - now())) / 86400.0;
  _new_status := _sub.status;

  IF _sub.status = 'trial' THEN
    IF _days_left <= 0 THEN
      _new_status := 'expired';
    ELSIF _days_left <= 7 THEN
      _new_status := 'trial_ending';
    END IF;
  ELSIF _sub.status IN ('trial_ending') THEN
    IF _days_left <= 0 THEN _new_status := 'expired'; END IF;
  ELSIF _sub.status = 'active' THEN
    IF _days_left <= 0 THEN
      IF _sub.cancel_at_period_end THEN
        _new_status := 'cancelled';
      ELSE
        _new_status := 'payment_due';
      END IF;
    END IF;
  ELSIF _sub.status = 'payment_due' THEN
    IF _days_left <= -7 THEN
      _new_status := 'expired';
    ELSIF _days_left <= -3 THEN
      _new_status := 'grace';
    END IF;
  ELSIF _sub.status = 'grace' THEN
    IF _days_left <= -7 THEN _new_status := 'expired'; END IF;
  END IF;

  IF _new_status <> _sub.status THEN
    UPDATE public.subscriptions SET status = _new_status WHERE id = _sub.id;
    INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, from_status, to_status)
    VALUES (_uid, _sub.id,
      CASE _new_status
        WHEN 'expired'      THEN 'expired'
        WHEN 'cancelled'    THEN 'cancelled'
        WHEN 'trial_ending' THEN 'trial_ending_soon'
        WHEN 'payment_due'  THEN 'payment_failed'
        WHEN 'grace'        THEN 'payment_failed'
        ELSE 'plan_changed'
      END,
      _sub.status, _new_status);

    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (_uid, NULL,
      CASE _new_status
        WHEN 'expired'      THEN 'subscription_expired'
        WHEN 'cancelled'    THEN 'subscription_cancelled'
        WHEN 'trial_ending' THEN 'subscription_trial_ending'
        WHEN 'payment_due'  THEN 'subscription_payment_due'
        WHEN 'grace'        THEN 'subscription_grace_period'
        ELSE 'subscription_updated'
      END);
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', _new_status, 'days_left', _days_left);
END;
$$;

-- get current subscription with plan join
CREATE OR REPLACE FUNCTION public.get_my_subscription()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row jsonb;
BEGIN
  IF _uid IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'id', s.id,
    'status', s.status,
    'billing_cycle', s.billing_cycle,
    'price_cents', s.price_cents,
    'currency', s.currency,
    'start_date', s.start_date,
    'end_date', s.end_date,
    'next_billing_date', s.next_billing_date,
    'cancel_at_period_end', s.cancel_at_period_end,
    'trial_used', s.trial_used,
    'plan', jsonb_build_object(
      'code', p.code, 'name', p.name, 'description', p.description,
      'price_cents', p.price_cents, 'billing_cycle', p.billing_cycle
    )
  ) INTO _row
  FROM public.subscriptions s
  JOIN public.subscription_plans p ON p.id = s.plan_id
  WHERE s.trainer_id = _uid;
  RETURN _row;
END;
$$;

-- helper for access gating (used by Discover / Leads)
CREATE OR REPLACE FUNCTION public.trainer_has_active_subscription(_trainer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE trainer_id = _trainer_id
      AND status IN ('trial','trial_ending','active','grace','lifetime','payment_due')
  );
$$;

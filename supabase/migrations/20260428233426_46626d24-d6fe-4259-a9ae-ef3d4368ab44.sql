
-- Extend profiles for businesses
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_type text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS home_delivery text,
  ADD COLUMN IF NOT EXISTS business_hours jsonb,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Business gallery (reuse same shape as trainer_gallery)
CREATE TABLE IF NOT EXISTS public.business_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business gallery visible to everyone" ON public.business_gallery FOR SELECT USING (true);
CREATE POLICY "Business owner can insert own gallery" ON public.business_gallery FOR INSERT WITH CHECK (auth.uid() = business_id);
CREATE POLICY "Business owner can update own gallery" ON public.business_gallery FOR UPDATE USING (auth.uid() = business_id);
CREATE POLICY "Business owner can delete own gallery" ON public.business_gallery FOR DELETE USING (auth.uid() = business_id);

-- Business engagement events (clicks)
CREATE TABLE IF NOT EXISTS public.business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  visitor_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('call_click','whatsapp_click','website_click','delivery_request','instagram_click')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own events" ON public.business_events FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Anyone can record event" ON public.business_events FOR INSERT WITH CHECK (true);

-- Lead status & owner update access
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Owner updates lead status') THEN
    CREATE POLICY "Owner updates lead status" ON public.leads FOR UPDATE USING (auth.uid() = trainer_id);
  END IF;
END $$;

-- Storage bucket for business gallery
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-gallery', 'business-gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Business gallery public read" ON storage.objects FOR SELECT USING (bucket_id = 'business-gallery');
CREATE POLICY "Business owner uploads gallery" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'business-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Business owner updates gallery" ON storage.objects FOR UPDATE USING (bucket_id = 'business-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Business owner deletes gallery" ON storage.objects FOR DELETE USING (bucket_id = 'business-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed business plans
INSERT INTO public.subscription_plans (code, name, description, price_cents, currency, billing_cycle, trial_days, is_active, is_default_trial, sort_order)
VALUES
  ('business_monthly', 'Business Monthly', 'Lead generation for gyms & supplement stores', 3000, 'USD', 'monthly', 0, true, false, 20),
  ('business_annual',  'Business Annual',  'Save 17% — best for established businesses',     30000, 'USD', 'annual',  0, true, false, 21)
ON CONFLICT (code) DO NOTHING;

-- Update handle_new_user to set business defaults (trial start + status)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  _btype text := NEW.raw_user_meta_data->>'business_type';
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, username, role, business_type,
    profile_visibility, trial_started_at, subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', NEW.email, ''),
    LOWER(NEW.raw_user_meta_data->>'username'),
    _role,
    CASE WHEN _role = 'business' THEN _btype ELSE NULL END,
    'public',
    CASE WHEN _role IN ('trainer','business') THEN now() ELSE NULL END,
    CASE WHEN _role IN ('trainer','business') THEN 'trial' ELSE 'inactive' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    role = COALESCE(EXCLUDED.role, profiles.role),
    business_type = COALESCE(EXCLUDED.business_type, profiles.business_type);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generalize subscription auto-create to also cover business role
CREATE OR REPLACE FUNCTION public.handle_new_trainer_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _trial public.subscription_plans;
BEGIN
  IF NEW.role NOT IN ('trainer','business') THEN
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
$function$;

DROP TRIGGER IF EXISTS trg_profiles_trainer_trial ON public.profiles;
CREATE TRIGGER trg_profiles_trainer_trial
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_trainer_subscription();

-- Backfill any existing business profiles missing a subscription
INSERT INTO public.subscriptions (trainer_id, plan_id, status, billing_cycle, price_cents, currency, start_date, end_date, next_billing_date, trial_used)
SELECT p.id, t.id, 'trial', 'trial', 0, t.currency, now(), now() + (t.trial_days || ' days')::interval, now() + (t.trial_days || ' days')::interval, true
FROM public.profiles p
CROSS JOIN LATERAL (SELECT * FROM public.subscription_plans WHERE is_default_trial = true LIMIT 1) t
WHERE p.role = 'business'
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.trainer_id = p.id);

-- Helper: business stats RPC
CREATE OR REPLACE FUNCTION public.get_business_stats(_business_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'views',           (SELECT count(*) FROM public.profile_views WHERE trainer_id = _business_id),
    'leads',           (SELECT count(*) FROM public.leads WHERE trainer_id = _business_id),
    'leads_new',       (SELECT count(*) FROM public.leads WHERE trainer_id = _business_id AND status = 'new' AND created_at > now() - interval '7 days'),
    'call_clicks',     (SELECT count(*) FROM public.business_events WHERE business_id = _business_id AND event_type = 'call_click'),
    'whatsapp_clicks', (SELECT count(*) FROM public.business_events WHERE business_id = _business_id AND event_type = 'whatsapp_click'),
    'website_clicks',  (SELECT count(*) FROM public.business_events WHERE business_id = _business_id AND event_type = 'website_click'),
    'delivery_requests',(SELECT count(*) FROM public.business_events WHERE business_id = _business_id AND event_type = 'delivery_request')
  );
$$;

-- Record business engagement event
CREATE OR REPLACE FUNCTION public.record_business_event(_business_id uuid, _event_type text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _viewer uuid := auth.uid();
BEGIN
  IF _viewer IS NOT NULL AND _viewer = _business_id THEN RETURN; END IF;
  INSERT INTO public.business_events (business_id, visitor_id, event_type)
  VALUES (_business_id, _viewer, _event_type);
END;
$$;

-- Update lead status RPC (validates ownership and status enum)
CREATE OR REPLACE FUNCTION public.update_lead_status(_lead_id uuid, _status text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _ok int;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  IF _status NOT IN ('new','contacted','closed') THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_status'); END IF;
  UPDATE public.leads SET status = _status WHERE id = _lead_id AND trainer_id = _uid;
  GET DIAGNOSTICS _ok = ROW_COUNT;
  IF _ok = 0 THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found_or_forbidden'); END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

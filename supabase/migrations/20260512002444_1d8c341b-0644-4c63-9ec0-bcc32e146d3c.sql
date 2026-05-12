
-- Skip local date-based recompute for Stripe-managed subscriptions; webhooks own the truth.
CREATE OR REPLACE FUNCTION public.recompute_subscription_status(_trainer_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := COALESCE(_trainer_id, auth.uid());
  _sub public.subscriptions;
  _new_status text;
  _days_left numeric;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;

  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','no_subscription'); END IF;

  -- If Stripe is managing this subscription, do not override status from local dates.
  IF _sub.payment_provider = 'stripe' AND _sub.stripe_subscription_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'status', _sub.status, 'managed_by', 'stripe');
  END IF;

  IF _sub.status = 'lifetime' THEN
    RETURN jsonb_build_object('ok',true,'status','lifetime');
  END IF;

  _days_left := EXTRACT(EPOCH FROM (_sub.end_date - now())) / 86400.0;
  _new_status := _sub.status;

  IF _sub.status = 'trial' THEN
    IF _days_left <= 0 THEN _new_status := 'expired';
    ELSIF _days_left <= 7 THEN _new_status := 'trial_ending';
    END IF;
  ELSIF _sub.status IN ('trial_ending') THEN
    IF _days_left <= 0 THEN _new_status := 'expired'; END IF;
  ELSIF _sub.status = 'active' THEN
    IF _days_left <= 0 THEN
      IF _sub.cancel_at_period_end THEN _new_status := 'cancelled';
      ELSE _new_status := 'payment_due'; END IF;
    END IF;
  ELSIF _sub.status = 'payment_due' THEN
    IF _days_left <= -7 THEN _new_status := 'expired';
    ELSIF _days_left <= -3 THEN _new_status := 'grace';
    END IF;
  ELSIF _sub.status = 'grace' THEN
    IF _days_left <= -7 THEN _new_status := 'expired'; END IF;
  END IF;

  IF _new_status <> _sub.status THEN
    UPDATE public.subscriptions SET status = _new_status WHERE id = _sub.id;
    INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, from_status, to_status)
    VALUES (_uid, _sub.id, 'plan_changed', _sub.status, _new_status);
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', _new_status, 'days_left', _days_left);
END;
$function$;

-- Cancel/reactivate must not mutate Stripe-managed subs locally.
CREATE OR REPLACE FUNCTION public.cancel_subscription()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _sub public.subscriptions;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason','unauthenticated'); END IF;
  SELECT * INTO _sub FROM public.subscriptions WHERE trainer_id = _uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason','no_subscription'); END IF;

  IF _sub.payment_provider = 'stripe' AND _sub.stripe_subscription_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason','use_stripe_portal');
  END IF;

  UPDATE public.subscriptions SET cancel_at_period_end = true WHERE id = _sub.id;
  INSERT INTO public.subscription_events (trainer_id, subscription_id, event_type, to_status)
  VALUES (_uid, _sub.id, 'cancel_requested', _sub.status);
  RETURN jsonb_build_object('ok', true, 'access_until', _sub.end_date);
END;
$function$;

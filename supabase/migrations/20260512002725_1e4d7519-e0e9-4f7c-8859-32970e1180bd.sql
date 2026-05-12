CREATE OR REPLACE FUNCTION public.get_my_subscription()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'payment_provider', s.payment_provider,
    'stripe_subscription_id', s.stripe_subscription_id,
    'stripe_customer_id', s.stripe_customer_id,
    'environment', s.environment,
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
$function$;
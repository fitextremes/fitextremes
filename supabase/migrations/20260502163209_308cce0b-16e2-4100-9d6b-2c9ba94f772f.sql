
UPDATE public.subscription_plans
SET name = 'Personal Trainer Plan',
    price_cents = 1500,
    currency = 'CAD',
    billing_cycle = 'monthly',
    trial_days = 30,
    is_active = true,
    is_default_trial = true,
    description = 'First month free, then $15 CAD/month',
    sort_order = 1
WHERE code = 'monthly';

-- Ensure no other plans show as active for trainers
UPDATE public.subscription_plans SET is_active = false WHERE code <> 'monthly';

-- Update existing trainer subscriptions to reflect new price/currency
UPDATE public.subscriptions s
SET price_cents = 1500, currency = 'CAD'
FROM public.subscription_plans p
WHERE s.plan_id = p.id AND p.code = 'monthly';

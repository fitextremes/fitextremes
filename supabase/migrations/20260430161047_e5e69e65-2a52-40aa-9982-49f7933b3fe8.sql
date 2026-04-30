UPDATE public.subscription_plans
SET name = 'Personal Trainer Plan',
    description = 'Everything you need to grow your training business',
    price_cents = 2000,
    sort_order = 1
WHERE code = 'monthly';

UPDATE public.subscription_plans
SET is_active = false
WHERE code IN ('pro', 'annual', 'enterprise');
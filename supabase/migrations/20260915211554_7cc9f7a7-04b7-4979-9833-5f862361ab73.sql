DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.username,
  p.full_name,
  p.role,
  p.business_type,
  p.avatar_url,
  p.bio,
  p.location,
  p.profile_visibility,
  p.website_url,
  p.instagram_url,
  p.business_hours,
  p.home_delivery,
  p.hourly_min,
  p.hourly_max,
  p.years_experience,
  p.certifications,
  p.is_suspended,
  p.signup_user_type,
  p.created_at,
  p.updated_at,
  NULL::text AS email,
  CASE WHEN p.role IN ('business','trainer') THEN p.phone ELSE NULL END AS phone,
  CASE WHEN p.role IN ('business','trainer') THEN p.whatsapp_number ELSE NULL END AS whatsapp_number
FROM public.profiles p
WHERE p.is_suspended = false;

GRANT SELECT ON public.profiles_public TO anon, authenticated, service_role;
-- Remove the blanket table-wide read access that exposed every column
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

-- Public/safe columns only (no email, phone, whatsapp_number, latitude, longitude)
GRANT SELECT (
  id, username, full_name, role, avatar_url, bio, location,
  profile_visibility, created_at, updated_at,
  hourly_min, hourly_max, years_experience, certifications,
  trial_started_at, subscription_status, business_type,
  website_url, instagram_url, home_delivery, business_hours,
  is_suspended, terms_accepted, privacy_accepted,
  legal_consent_at, legal_consent_version, signup_user_type
) ON public.profiles TO anon, authenticated;

-- Owners still need to create/maintain their own row (RLS limits this to auth.uid() = id)
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;
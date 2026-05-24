
-- Restore public SELECT row visibility
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Column-level: hide sensitive columns from anon & authenticated direct reads.
-- They remain readable for service_role and for the postgres role that owns profiles_public,
-- so the role-conditional view still exposes them for trainers/businesses.
REVOKE SELECT (email, phone, whatsapp_number, latitude, longitude) ON public.profiles FROM anon, authenticated;

-- Re-grant the safe columns to anon/authenticated (REVOKE above only affected listed cols,
-- but ensuring the rest stay readable):
GRANT SELECT (
  id, username, full_name, role, business_type, avatar_url, bio, location,
  profile_visibility, website_url, instagram_url, business_hours, home_delivery,
  hourly_min, hourly_max, years_experience, certifications, is_suspended,
  signup_user_type, terms_accepted, privacy_accepted, legal_consent_at,
  legal_consent_version, subscription_status, trial_started_at, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Owner full-profile RPC (returns sensitive cols too)
CREATE OR REPLACE FUNCTION public.get_my_full_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_full_profile() FROM public;
GRANT  EXECUTE ON FUNCTION public.get_my_full_profile() TO authenticated;

-- Username -> email lookup for "login with username" flow (returns NULL if not found)
CREATE OR REPLACE FUNCTION public.lookup_email_by_username(_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE lower(username) = lower(_username) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_email_by_username(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.lookup_email_by_username(text) TO anon, authenticated;

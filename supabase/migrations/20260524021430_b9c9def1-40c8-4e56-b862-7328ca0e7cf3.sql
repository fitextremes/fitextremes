
-- Replace blanket public SELECT with owner-only SELECT
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Public view exposing only safe fields + role-conditional contact info
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  id,
  username,
  full_name,
  role,
  business_type,
  avatar_url,
  bio,
  location,
  profile_visibility,
  website_url,
  instagram_url,
  business_hours,
  home_delivery,
  hourly_min,
  hourly_max,
  years_experience,
  certifications,
  is_suspended,
  signup_user_type,
  created_at,
  updated_at,
  -- Contact fields: only exposed for trainers and businesses
  CASE WHEN role IN ('trainer','business') THEN email          ELSE NULL END AS email,
  CASE WHEN role IN ('trainer','business') THEN phone          ELSE NULL END AS phone,
  CASE WHEN role IN ('trainer','business') THEN whatsapp_number ELSE NULL END AS whatsapp_number
FROM public.profiles
WHERE is_suspended = false;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Helper: username availability check (pre-auth, used during signup)
CREATE OR REPLACE FUNCTION public.lookup_username_taken(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username));
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_username_taken(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.lookup_username_taken(text) TO anon, authenticated;

-- Helper: returns the role for a given email (used by business/trainer auth flows to detect signup vs. wrong-tab)
-- Does NOT confirm existence of an account beyond returning role text.
CREATE OR REPLACE FUNCTION public.lookup_email_role(_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE lower(email) = lower(_email) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_email_role(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.lookup_email_role(text) TO anon, authenticated;

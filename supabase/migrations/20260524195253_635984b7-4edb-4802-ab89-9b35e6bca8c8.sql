
-- 1) Lock down profiles: only own row readable directly.
-- Cross-user reads must go through profiles_public view, which filters columns.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2) Recreate profiles_public view with profile_visibility enforcement for social users.
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  id, username, full_name, role, business_type, avatar_url, bio, location,
  profile_visibility, website_url, instagram_url, business_hours, home_delivery,
  hourly_min, hourly_max, years_experience, certifications, is_suspended,
  signup_user_type, created_at, updated_at,
  CASE WHEN role = ANY (ARRAY['trainer'::text,'business'::text]) THEN email ELSE NULL END AS email,
  CASE WHEN role = ANY (ARRAY['trainer'::text,'business'::text]) THEN phone ELSE NULL END AS phone,
  CASE WHEN role = ANY (ARRAY['trainer'::text,'business'::text]) THEN whatsapp_number ELSE NULL END AS whatsapp_number
FROM public.profiles
WHERE is_suspended = false
  AND (role <> 'user' OR profile_visibility = 'public');

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 3) connection_requests: allow trainer/business targets to read their requests.
CREATE POLICY "Trainer/business targets can view requests sent to them"
  ON public.connection_requests FOR SELECT
  TO authenticated
  USING (
    target_type IN ('trainer','business')
    AND target_id = (auth.uid())::text
  );

CREATE POLICY "Trainer/business targets can update requests sent to them"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING (
    target_type IN ('trainer','business')
    AND target_id = (auth.uid())::text
  )
  WITH CHECK (
    target_type IN ('trainer','business')
    AND target_id = (auth.uid())::text
  );

-- 4) profile_views: remove the open INSERT policy. Force use of record_profile_view RPC,
--    which is SECURITY DEFINER and sets viewer_id server-side.
DROP POLICY IF EXISTS "Anyone can record a view" ON public.profile_views;

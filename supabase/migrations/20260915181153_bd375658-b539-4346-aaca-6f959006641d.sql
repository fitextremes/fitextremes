ALTER VIEW public.post_authors SET (security_invoker = true);

GRANT SELECT (id, username, full_name, avatar_url, role, is_suspended) ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read safe author profiles" ON public.profiles;
CREATE POLICY "Public can read safe author profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (is_suspended = false);
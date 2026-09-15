-- post_authors must keep serving public author info without relying on a table-wide read policy
ALTER VIEW public.post_authors SET (security_invoker = false);

-- Remove the over-broad direct read access to the base profiles table
DROP POLICY IF EXISTS "Public can read safe author profiles" ON public.profiles;

-- Ensure only the owner can read their own row directly
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
GRANT SELECT ON public.post_authors TO anon, authenticated;
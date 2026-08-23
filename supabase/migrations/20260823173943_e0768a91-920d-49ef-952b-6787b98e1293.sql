DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

REVOKE INSERT, UPDATE, DELETE ON public.business_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profile_views FROM anon, authenticated;
GRANT ALL ON public.business_events TO service_role;
GRANT ALL ON public.profile_views TO service_role;
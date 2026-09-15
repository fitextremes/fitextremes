CREATE OR REPLACE VIEW public.post_authors
WITH (security_invoker = false) AS
SELECT id, username, full_name, avatar_url, role
FROM public.profiles
WHERE is_suspended = false;

REVOKE ALL ON public.post_authors FROM PUBLIC;
GRANT SELECT ON public.post_authors TO anon, authenticated;
GRANT ALL ON public.post_authors TO service_role;
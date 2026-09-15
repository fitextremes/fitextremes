CREATE OR REPLACE VIEW public.post_authors AS
  SELECT id, username, full_name, avatar_url, role
  FROM public.profiles
  WHERE is_suspended = false;

ALTER VIEW public.post_authors SET (security_invoker = off);

GRANT SELECT ON public.post_authors TO anon, authenticated;
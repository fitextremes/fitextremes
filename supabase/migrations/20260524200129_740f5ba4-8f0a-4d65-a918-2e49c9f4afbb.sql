-- Stop anonymous callers from harvesting user emails via the username->email RPC.
-- Username sign-in is now performed server-side via the username-signin edge function.
REVOKE EXECUTE ON FUNCTION public.lookup_email_by_username(text) FROM anon, public;
-- Keep authenticated access available (not strictly required, but harmless for admin tooling).
GRANT EXECUTE ON FUNCTION public.lookup_email_by_username(text) TO authenticated;
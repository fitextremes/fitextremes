CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

GRANT SELECT ON public.profiles TO anon;
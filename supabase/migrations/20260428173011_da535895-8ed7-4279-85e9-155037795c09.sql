-- Add trainer-specific columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hourly_min numeric,
  ADD COLUMN IF NOT EXISTS hourly_max numeric,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS certifications text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive';

-- Trainers must be public by default
UPDATE public.profiles SET profile_visibility = 'public' WHERE role = 'trainer';

-- Profile views (one row per view; dedupe at app/RPC level)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  viewer_id uuid,
  viewer_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profile_views_trainer ON public.profile_views(trainer_id, created_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers can view their own profile views" ON public.profile_views;
CREATE POLICY "Trainers can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Anyone can record a view" ON public.profile_views;
CREATE POLICY "Anyone can record a view"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Leads from public profile contact form
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  sender_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_trainer ON public.leads(trainer_id, created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainer can read own leads" ON public.leads;
CREATE POLICY "Trainer can read own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- RPC: record a profile view (skips self-views, dedupes within 1 hour for same viewer)
CREATE OR REPLACE FUNCTION public.record_profile_view(_trainer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _viewer uuid := auth.uid();
BEGIN
  IF _viewer IS NOT NULL AND _viewer = _trainer_id THEN
    RETURN;
  END IF;

  IF _viewer IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE trainer_id = _trainer_id
      AND viewer_id = _viewer
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.profile_views (trainer_id, viewer_id)
  VALUES (_trainer_id, _viewer);
END;
$$;

-- RPC: trainer stats (count views and leads)
CREATE OR REPLACE FUNCTION public.get_trainer_stats(_trainer_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'views', (SELECT count(*) FROM public.profile_views WHERE trainer_id = _trainer_id),
    'leads', (SELECT count(*) FROM public.leads WHERE trainer_id = _trainer_id)
  );
$$;
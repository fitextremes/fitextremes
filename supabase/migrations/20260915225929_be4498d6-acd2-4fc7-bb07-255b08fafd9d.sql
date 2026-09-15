CREATE TABLE public.cycle_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_cycle_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cycle_settings_days_range CHECK (avg_cycle_days IS NULL OR (avg_cycle_days >= 15 AND avg_cycle_days <= 60))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_settings TO authenticated;
GRANT ALL ON public.cycle_settings TO service_role;

ALTER TABLE public.cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own cycle settings"
ON public.cycle_settings FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_cycle_settings_updated_at
BEFORE UPDATE ON public.cycle_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
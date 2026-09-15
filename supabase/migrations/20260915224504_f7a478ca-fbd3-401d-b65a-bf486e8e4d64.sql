CREATE TABLE public.cycle_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_ongoing boolean NOT NULL DEFAULT false,
  flow text NOT NULL DEFAULT 'medium',
  symptoms text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX cycle_logs_user_start_idx ON public.cycle_logs (user_id, start_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_logs TO authenticated;
GRANT ALL ON public.cycle_logs TO service_role;

ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cycle logs"
  ON public.cycle_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cycle logs"
  ON public.cycle_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycle logs"
  ON public.cycle_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycle logs"
  ON public.cycle_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_cycle_logs_updated_at
  BEFORE UPDATE ON public.cycle_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
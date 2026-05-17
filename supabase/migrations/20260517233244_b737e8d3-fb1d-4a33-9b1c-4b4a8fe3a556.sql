CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight NUMERIC NOT NULL DEFAULT 0,
  weight_unit TEXT NOT NULL DEFAULT 'lbs' CHECK (weight_unit IN ('lbs','kg')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own workout logs"
  ON public.workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_workout_logs_user_created ON public.workout_logs(user_id, created_at DESC);
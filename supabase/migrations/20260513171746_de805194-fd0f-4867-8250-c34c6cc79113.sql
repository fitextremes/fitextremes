
CREATE TABLE public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_name text NOT NULL,
  brand text,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  serving_size text,
  quantity numeric NOT NULL DEFAULT 1,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snacks')),
  source_api text,
  source_id text,
  logged_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_logs_user_date ON public.food_logs (user_id, logged_date);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own food logs" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own food logs" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own food logs" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own food logs" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_food_logs_updated_at
  BEFORE UPDATE ON public.food_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nutrition_goals (
  user_id uuid PRIMARY KEY,
  calorie_goal integer NOT NULL DEFAULT 2000,
  protein_goal integer NOT NULL DEFAULT 150,
  carb_goal integer NOT NULL DEFAULT 250,
  fat_goal integer NOT NULL DEFAULT 65,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own goals" ON public.nutrition_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own goals" ON public.nutrition_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.nutrition_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own goals" ON public.nutrition_goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_nutrition_goals_updated_at
  BEFORE UPDATE ON public.nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

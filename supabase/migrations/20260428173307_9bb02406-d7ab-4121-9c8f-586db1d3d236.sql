CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, username, role,
    profile_visibility, trial_started_at, subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', NEW.email, ''),
    LOWER(NEW.raw_user_meta_data->>'username'),
    _role,
    CASE WHEN _role = 'trainer' THEN 'public' ELSE 'public' END,
    CASE WHEN _role = 'trainer' THEN now() ELSE NULL END,
    CASE WHEN _role = 'trainer' THEN 'trial' ELSE 'inactive' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$;
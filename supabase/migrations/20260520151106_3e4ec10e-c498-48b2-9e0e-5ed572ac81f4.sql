
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS legal_consent_version text,
  ADD COLUMN IF NOT EXISTS signup_user_type text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  _btype text := NEW.raw_user_meta_data->>'business_type';
  _terms boolean := COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::boolean, false);
  _privacy boolean := COALESCE((NEW.raw_user_meta_data->>'privacy_accepted')::boolean, false);
  _version text := NEW.raw_user_meta_data->>'legal_consent_version';
  _signup_type text := NEW.raw_user_meta_data->>'signup_user_type';
  _consent_at timestamptz := CASE WHEN _terms AND _privacy THEN now() ELSE NULL END;
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, username, role, business_type,
    profile_visibility, trial_started_at, subscription_status,
    terms_accepted, privacy_accepted, legal_consent_at, legal_consent_version, signup_user_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', NEW.email, ''),
    LOWER(NEW.raw_user_meta_data->>'username'),
    _role,
    CASE WHEN _role = 'business' THEN _btype ELSE NULL END,
    'public',
    CASE WHEN _role IN ('trainer','business') THEN now() ELSE NULL END,
    CASE WHEN _role IN ('trainer','business') THEN 'trial' ELSE 'inactive' END,
    _terms, _privacy, _consent_at, _version, _signup_type
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    username = COALESCE(EXCLUDED.username, profiles.username),
    role = COALESCE(EXCLUDED.role, profiles.role),
    business_type = COALESCE(EXCLUDED.business_type, profiles.business_type),
    terms_accepted = profiles.terms_accepted OR EXCLUDED.terms_accepted,
    privacy_accepted = profiles.privacy_accepted OR EXCLUDED.privacy_accepted,
    legal_consent_at = COALESCE(profiles.legal_consent_at, EXCLUDED.legal_consent_at),
    legal_consent_version = COALESCE(profiles.legal_consent_version, EXCLUDED.legal_consent_version),
    signup_user_type = COALESCE(profiles.signup_user_type, EXCLUDED.signup_user_type);
  RETURN NEW;
END;
$function$;

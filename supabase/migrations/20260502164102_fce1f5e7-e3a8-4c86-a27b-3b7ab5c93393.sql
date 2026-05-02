CREATE OR REPLACE FUNCTION public.record_profile_view(_trainer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _viewer uuid := auth.uid();
BEGIN
  -- Self-view: never count
  IF _viewer IS NOT NULL AND _viewer = _trainer_id THEN
    RETURN;
  END IF;

  -- Dedup: same logged-in viewer + same trainer within 30 minutes => skip
  IF _viewer IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE trainer_id = _trainer_id
      AND viewer_id = _viewer
      AND created_at > now() - interval '30 minutes'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.profile_views (trainer_id, viewer_id)
  VALUES (_trainer_id, _viewer);
END;
$function$;
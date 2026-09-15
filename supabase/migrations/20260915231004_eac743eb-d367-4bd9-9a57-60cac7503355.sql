-- 1. Remove existing self-notifications and self-referential types
DELETE FROM public.notifications
WHERE actor_id = recipient_id
   OR type IN ('follow_success','follow_request_sent','follow_request_accepted_self','follow_request_declined_self');

-- 2. Hard guard: never allow self-notifications
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_no_self_notify
  CHECK (actor_id IS NULL OR actor_id <> recipient_id);

-- 3. Triggers: notify only the other party
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.follower_id IS DISTINCT FROM NEW.following_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'new_follower');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' AND NEW.requester_id IS DISTINCT FROM NEW.target_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (NEW.target_id, NEW.requester_id, 'follow_request_received', NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. resolve_follow_request: drop the requester's "sent" cleanup of self rows, keep other-party notices
CREATE OR REPLACE FUNCTION public.resolve_follow_request(_request_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _req RECORD;
BEGIN
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;

  SELECT * INTO _req FROM public.follow_requests WHERE id = _request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF _req.target_id <> _caller THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;

  IF _req.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_resolved');
  END IF;

  DELETE FROM public.notifications
    WHERE type = 'follow_request_received'
      AND follow_request_id = _request_id;

  IF _accept THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (_req.requester_id, _req.target_id)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.follow_requests WHERE id = _request_id;

    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (_req.requester_id, _req.target_id, 'follow_request_accepted', NULL);

    RETURN jsonb_build_object('ok', true, 'status', 'accepted');
  ELSE
    DELETE FROM public.follow_requests WHERE id = _request_id;

    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (_req.requester_id, _req.target_id, 'follow_request_declined', NULL);

    RETURN jsonb_build_object('ok', true, 'status', 'declined');
  END IF;
END;
$function$;
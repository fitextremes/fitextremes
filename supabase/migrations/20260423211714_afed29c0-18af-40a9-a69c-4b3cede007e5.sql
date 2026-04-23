
CREATE OR REPLACE FUNCTION public.resolve_follow_request(_request_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF _accept THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (_req.requester_id, _req.target_id)
    ON CONFLICT DO NOTHING;

    DELETE FROM public.follow_requests WHERE id = _request_id;

    DELETE FROM public.notifications
      WHERE recipient_id = _req.target_id
        AND type = 'follow_request_received'
        AND follow_request_id = _request_id;

    DELETE FROM public.notifications
      WHERE recipient_id = _req.requester_id
        AND type = 'follow_request_sent'
        AND follow_request_id = _request_id;

    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (_req.requester_id, _req.target_id, 'follow_request_accepted', NULL);

    RETURN jsonb_build_object('ok', true, 'status', 'accepted');
  ELSE
    DELETE FROM public.follow_requests WHERE id = _request_id;

    DELETE FROM public.notifications
      WHERE recipient_id = _req.target_id
        AND type = 'follow_request_received'
        AND follow_request_id = _request_id;

    DELETE FROM public.notifications
      WHERE recipient_id = _req.requester_id
        AND type = 'follow_request_sent'
        AND follow_request_id = _request_id;

    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (_req.requester_id, _req.target_id, 'follow_request_declined', NULL);

    RETURN jsonb_build_object('ok', true, 'status', 'declined');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_follow_request(uuid, boolean) TO authenticated;


-- Trigger: new follower
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.follower_id IS DISTINCT FROM NEW.following_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'new_follower');
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (NEW.follower_id, NEW.follower_id, 'follow_success');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follower ON public.follows;
CREATE TRIGGER trg_notify_new_follower
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follower();

-- Trigger: follow request created
CREATE OR REPLACE FUNCTION public.notify_new_follow_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.requester_id IS DISTINCT FROM NEW.target_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (NEW.target_id, NEW.requester_id, 'follow_request_received', NEW.id);
    INSERT INTO public.notifications (recipient_id, actor_id, type, follow_request_id)
    VALUES (NEW.requester_id, NEW.requester_id, 'follow_request_sent', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_follow_request ON public.follow_requests;
CREATE TRIGGER trg_notify_new_follow_request
AFTER INSERT ON public.follow_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_follow_request();

-- Trigger: post reaction
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (_owner, NEW.user_id, 'post_reaction');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_reaction ON public.reactions;
CREATE TRIGGER trg_notify_post_reaction
AFTER INSERT ON public.reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_post_reaction();

-- Trigger: post comment
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type)
    VALUES (_owner, NEW.user_id, 'post_comment');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.comments;
CREATE TRIGGER trg_notify_post_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

-- Enable realtime on notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

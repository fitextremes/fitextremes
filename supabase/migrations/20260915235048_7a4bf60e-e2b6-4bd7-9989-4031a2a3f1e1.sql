ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS post_id uuid,
  ADD COLUMN IF NOT EXISTS comment_id uuid;

CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id)
    VALUES (_owner, NEW.user_id, 'post_reaction', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.posts WHERE id = NEW.post_id;
  IF _owner IS NOT NULL AND _owner <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    VALUES (_owner, NEW.user_id, 'post_comment', NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

UPDATE public.notifications n
SET post_id = (
  SELECT r.post_id FROM public.reactions r
  JOIN public.posts p ON p.id = r.post_id
  WHERE r.user_id = n.actor_id AND p.user_id = n.recipient_id
  ORDER BY abs(extract(epoch FROM (r.created_at - n.created_at)))
  LIMIT 1
)
WHERE n.type = 'post_reaction' AND n.post_id IS NULL;

UPDATE public.notifications n
SET post_id = (
  SELECT c.post_id FROM public.comments c
  JOIN public.posts p ON p.id = c.post_id
  WHERE c.user_id = n.actor_id AND p.user_id = n.recipient_id
  ORDER BY abs(extract(epoch FROM (c.created_at - n.created_at)))
  LIMIT 1
),
comment_id = (
  SELECT c.id FROM public.comments c
  JOIN public.posts p ON p.id = c.post_id
  WHERE c.user_id = n.actor_id AND p.user_id = n.recipient_id
  ORDER BY abs(extract(epoch FROM (c.created_at - n.created_at)))
  LIMIT 1
)
WHERE n.type = 'post_comment' AND n.post_id IS NULL;
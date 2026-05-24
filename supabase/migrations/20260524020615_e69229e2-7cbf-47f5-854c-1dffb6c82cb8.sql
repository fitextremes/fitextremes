
-- 1. notifications: drop overly permissive client INSERT (all creation goes through SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Users can create notifications as themselves" ON public.notifications;

-- 2. business_events: drop open INSERT (use record_business_event RPC which is SECURITY DEFINER)
DROP POLICY IF EXISTS "Anyone can record event" ON public.business_events;

-- 3. connection_requests: let recipients (target users) view & update requests addressed to them
CREATE POLICY "Targets can view requests sent to them"
  ON public.connection_requests
  FOR SELECT
  TO authenticated
  USING (target_type = 'user' AND target_id = auth.uid()::text);

CREATE POLICY "Targets can update requests sent to them"
  ON public.connection_requests
  FOR UPDATE
  TO authenticated
  USING (target_type = 'user' AND target_id = auth.uid()::text)
  WITH CHECK (target_type = 'user' AND target_id = auth.uid()::text);

-- 4. Revoke EXECUTE on sensitive SECURITY DEFINER functions from anonymous callers
REVOKE EXECUTE ON FUNCTION public.get_my_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.subscribe_to_plan(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reactivate_subscription() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.resolve_follow_request(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_lead_status(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recompute_subscription_status(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_my_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_plan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_follow_request(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_subscription_status(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications as themselves"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (actor_id IS NULL OR auth.uid() = actor_id);
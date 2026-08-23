DROP POLICY IF EXISTS "Users can subscribe to their own notification channel" ON realtime.messages;
CREATE POLICY "Users can subscribe to their own notification channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING ((select realtime.topic()) = 'notifications:' || auth.uid()::text);
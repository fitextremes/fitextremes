CREATE TABLE public.connection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('trainer', 'gym', 'supplement')),
  target_id TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 100 AND char_length(message) > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_pending_request ON public.connection_requests (sender_id, target_type, target_id) WHERE status = 'pending';

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.connection_requests
  FOR SELECT TO authenticated USING (auth.uid() = sender_id);

CREATE POLICY "Users can create own requests" ON public.connection_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
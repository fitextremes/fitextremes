
CREATE TABLE public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT follow_requests_status_check CHECK (status IN ('pending','accepted','declined')),
  CONSTRAINT follow_requests_no_self CHECK (requester_id <> target_id),
  CONSTRAINT follow_requests_unique UNIQUE (requester_id, target_id)
);

CREATE INDEX idx_follow_requests_target ON public.follow_requests(target_id, status);
CREATE INDEX idx_follow_requests_requester ON public.follow_requests(requester_id, status);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests they sent or received"
ON public.follow_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create their own follow requests"
ON public.follow_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Targets can update requests sent to them"
ON public.follow_requests FOR UPDATE
USING (auth.uid() = target_id);

CREATE POLICY "Requesters can cancel their own requests"
ON public.follow_requests FOR DELETE
USING (auth.uid() = requester_id);

CREATE TRIGGER update_follow_requests_updated_at
BEFORE UPDATE ON public.follow_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

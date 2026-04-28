-- Create trainer_gallery table
CREATE TABLE public.trainer_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery visible to everyone"
ON public.trainer_gallery FOR SELECT USING (true);

CREATE POLICY "Trainer can insert own gallery"
ON public.trainer_gallery FOR INSERT
WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainer can update own gallery"
ON public.trainer_gallery FOR UPDATE
USING (auth.uid() = trainer_id);

CREATE POLICY "Trainer can delete own gallery"
ON public.trainer_gallery FOR DELETE
USING (auth.uid() = trainer_id);

CREATE TRIGGER update_trainer_gallery_updated_at
BEFORE UPDATE ON public.trainer_gallery
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_trainer_gallery_trainer ON public.trainer_gallery(trainer_id, sort_order);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainer-gallery', 'trainer-gallery', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Trainer gallery public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'trainer-gallery');

CREATE POLICY "Trainer can upload own gallery files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trainer-gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trainer can update own gallery files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trainer-gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Trainer can delete own gallery files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trainer-gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
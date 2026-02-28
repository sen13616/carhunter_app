-- Spotting photos: links spottings to files in Storage (bucket spotting-photos).
-- Storage path format: <user_id>/<spotting_id>/<photo_id>.<ext>

CREATE TABLE IF NOT EXISTS public.spotting_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spotting_id uuid NOT NULL REFERENCES public.spottings(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  storage_path text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS spotting_photos_spotting_id_idx ON public.spotting_photos (spotting_id);
CREATE INDEX IF NOT EXISTS spotting_photos_user_id_idx ON public.spotting_photos (user_id);

ALTER TABLE public.spotting_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spotting_photos_select_own" ON public.spotting_photos;
CREATE POLICY "spotting_photos_select_own" ON public.spotting_photos FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "spotting_photos_insert_own" ON public.spotting_photos;
CREATE POLICY "spotting_photos_insert_own" ON public.spotting_photos FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "spotting_photos_delete_own" ON public.spotting_photos;
CREATE POLICY "spotting_photos_delete_own" ON public.spotting_photos FOR DELETE USING (auth.uid()::text = user_id);

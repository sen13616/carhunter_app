-- Legacy cars: user-maintained list, photos in bucket spotting-photos at <user_id>/legacy/<legacy_car_id>/<photo_id>.<ext>

CREATE TABLE IF NOT EXISTS public.legacy_cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  year int NULL,
  trim text NULL,
  colour text NULL,
  rarity_tier text NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS legacy_cars_user_id_idx ON public.legacy_cars (user_id);

ALTER TABLE public.legacy_cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legacy_cars_select_own" ON public.legacy_cars;
CREATE POLICY "legacy_cars_select_own" ON public.legacy_cars FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_cars_insert_own" ON public.legacy_cars;
CREATE POLICY "legacy_cars_insert_own" ON public.legacy_cars FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_cars_update_own" ON public.legacy_cars;
CREATE POLICY "legacy_cars_update_own" ON public.legacy_cars FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_cars_delete_own" ON public.legacy_cars;
CREATE POLICY "legacy_cars_delete_own" ON public.legacy_cars FOR DELETE USING (auth.uid()::text = user_id);

-- Legacy car photos: many photos per legacy car
CREATE TABLE IF NOT EXISTS public.legacy_car_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_car_id uuid NOT NULL REFERENCES public.legacy_cars(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  storage_path text NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS legacy_car_photos_legacy_car_id_idx ON public.legacy_car_photos (legacy_car_id);
CREATE INDEX IF NOT EXISTS legacy_car_photos_user_id_idx ON public.legacy_car_photos (user_id);

ALTER TABLE public.legacy_car_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legacy_car_photos_select_own" ON public.legacy_car_photos;
CREATE POLICY "legacy_car_photos_select_own" ON public.legacy_car_photos FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_car_photos_insert_own" ON public.legacy_car_photos;
CREATE POLICY "legacy_car_photos_insert_own" ON public.legacy_car_photos FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_car_photos_update_own" ON public.legacy_car_photos;
CREATE POLICY "legacy_car_photos_update_own" ON public.legacy_car_photos FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "legacy_car_photos_delete_own" ON public.legacy_car_photos;
CREATE POLICY "legacy_car_photos_delete_own" ON public.legacy_car_photos FOR DELETE USING (auth.uid()::text = user_id);

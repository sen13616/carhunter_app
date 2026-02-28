-- Allow users to update only their own spotting rows.
ALTER TABLE public.spottings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spottings_update_own" ON public.spottings;
CREATE POLICY "spottings_update_own" ON public.spottings
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

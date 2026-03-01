-- Daily quota tracking: date column + atomic consume RPC

-- Add daily_spots_date so we can reset when date changes (profiles may already have daily_spots_used)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_spots_date date DEFAULT current_date;

-- Ensure default and not null after backfill
UPDATE public.profiles SET daily_spots_date = current_date WHERE daily_spots_date IS NULL;
ALTER TABLE public.profiles ALTER COLUMN daily_spots_date SET DEFAULT current_date;
ALTER TABLE public.profiles ALTER COLUMN daily_spots_date SET NOT NULL;

-- subscription: 'monthly' | 'lifetime' | 'one_time' | null
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription text;

-- RPC: atomic quota consumption. Only operates on caller's profile. Resets daily_spots_used when date changes.
CREATE OR REPLACE FUNCTION public.try_consume_spot(p_user_id text, p_allowed int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_used int;
  v_date date;
  v_new_used int;
BEGIN
  -- Only allow acting on own profile
  IF p_user_id IS NULL OR p_user_id <> auth.uid()::text THEN
    RETURN jsonb_build_object('allowed', false, 'used', 0);
  END IF;

  v_id := auth.uid();
  SELECT daily_spots_used, daily_spots_date INTO v_used, v_date
  FROM public.profiles WHERE id = v_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'used', 0);
  END IF;

  -- Reset if new day
  IF v_date IS NULL OR v_date <> current_date THEN
    v_used := 0;
  END IF;

  IF v_used >= p_allowed THEN
    RETURN jsonb_build_object('allowed', false, 'used', v_used);
  END IF;

  v_new_used := v_used + 1;
  UPDATE public.profiles
  SET daily_spots_used = v_new_used, daily_spots_date = current_date
  WHERE id = v_id;

  RETURN jsonb_build_object('allowed', true, 'used', v_new_used);
END;
$$;

-- Allow authenticated users to call (function uses auth.uid() so only own row is touched)
GRANT EXECUTE ON FUNCTION public.try_consume_spot(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_spot(text, int) TO service_role;

COMMENT ON FUNCTION public.try_consume_spot IS 'Consume one daily spot for the current user. Resets count when date changes. Returns { allowed: boolean, used: number }.';

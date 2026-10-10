-- Migration: Persistent Database-Backed Rate Limiting & Atomic OTP Verification
-- Prevents serverless in-memory wipeouts and eliminates read-modify-write race conditions

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role and postgres to manage rate limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits' AND policyname = 'Service role manages rate limits'
  ) THEN
    CREATE POLICY "Service role manages rate limits"
      ON public.rate_limits
      FOR ALL
      USING (auth.jwt()->>'role' = 'service_role' OR current_user = 'postgres');
  END IF;
END $$;

-- 1. Atomic Rate Limiting Function
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_record public.rate_limits%ROWTYPE;
  v_new_count INT;
  v_new_reset TIMESTAMPTZ;
  v_allowed BOOLEAN;
  v_reset_ms BIGINT;
BEGIN
  -- Row lock query for strict concurrency control
  SELECT * INTO v_record FROM public.rate_limits WHERE key = p_key FOR UPDATE;

  IF v_record.key IS NULL OR v_now > v_record.reset_at THEN
    -- Initialize fresh window
    v_new_count := 1;
    v_new_reset := v_now + (p_window_seconds || ' seconds')::INTERVAL;

    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, v_new_count, v_new_reset)
    ON CONFLICT (key) DO UPDATE
    SET count = v_new_count, reset_at = v_new_reset;

    v_allowed := TRUE;
    v_reset_ms := p_window_seconds * 1000;
  ELSE
    -- Check existing window
    IF v_record.count >= p_limit THEN
      v_allowed := FALSE;
      v_new_count := v_record.count;
      v_new_reset := v_record.reset_at;
      v_reset_ms := GREATEST(0, (EXTRACT(EPOCH FROM (v_record.reset_at - v_now)) * 1000)::BIGINT);
    ELSE
      v_new_count := v_record.count + 1;
      v_new_reset := v_record.reset_at;
      UPDATE public.rate_limits SET count = v_new_count WHERE key = p_key;
      v_allowed := TRUE;
      v_reset_ms := GREATEST(0, (EXTRACT(EPOCH FROM (v_record.reset_at - v_now)) * 1000)::BIGINT);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'remaining', GREATEST(0, p_limit - v_new_count),
    'reset_ms', v_reset_ms
  );
END;
$$;

-- 2. Atomic OTP Attempt Counter & Verification
CREATE OR REPLACE FUNCTION public.verify_and_increment_otp_attempt(
  p_email TEXT,
  p_otp_hash TEXT,
  p_max_attempts INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record public.password_resets%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_new_attempts INT;
BEGIN
  -- Row lock on latest active OTP record to prevent concurrent brute-force race conditions
  SELECT * INTO v_record
  FROM public.password_resets
  WHERE email = LOWER(TRIM(p_email))
    AND used = FALSE
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 'NOT_FOUND');
  END IF;

  -- Check expiration
  IF v_record.expires_at < v_now THEN
    UPDATE public.password_resets SET used = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', false, 'status', 'EXPIRED');
  END IF;

  -- Check if max attempts already reached
  IF v_record.attempts >= p_max_attempts THEN
    UPDATE public.password_resets SET used = TRUE WHERE id = v_record.id;
    RETURN jsonb_build_object('success', false, 'status', 'MAX_ATTEMPTS_EXCEEDED');
  END IF;

  -- Check OTP hash match
  IF v_record.otp_hash = p_otp_hash THEN
    RETURN jsonb_build_object(
      'success', true,
      'id', v_record.id,
      'status', 'MATCH'
    );
  ELSE
    -- Atomically increment attempts and invalidate if reached cap
    v_new_attempts := v_record.attempts + 1;
    UPDATE public.password_resets
    SET attempts = v_new_attempts,
        used = (v_new_attempts >= p_max_attempts)
    WHERE id = v_record.id;

    RETURN jsonb_build_object(
      'success', false,
      'status', 'MISMATCH',
      'attempts', v_new_attempts,
      'remaining', GREATEST(0, p_max_attempts - v_new_attempts)
    );
  END IF;
END;
$$;

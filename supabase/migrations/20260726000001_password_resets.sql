-- Migration: Create password_resets table for OTP verification and password recovery
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  reset_token TEXT UNIQUE,
  attempts INT DEFAULT 0,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(reset_token);

-- Enable RLS (Service role / admin access only for maximum security)
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

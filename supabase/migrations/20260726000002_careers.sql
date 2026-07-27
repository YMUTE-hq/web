-- Migration: Create careers table for YMUTE internal organization job postings
CREATE TABLE IF NOT EXISTS public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  apply_email TEXT DEFAULT 'careers@ymute.com',
  apply_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

-- 1. Public can view open career postings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'careers' AND policyname = 'Public can view open careers') THEN
    CREATE POLICY "Public can view open careers" ON public.careers FOR SELECT USING (status = 'open');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'careers' AND policyname = 'Admins have full access to careers') THEN
    CREATE POLICY "Admins have full access to careers" ON public.careers FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    );
  END IF;
END $$;

-- Index for fast status and department querying
CREATE INDEX IF NOT EXISTS idx_careers_status ON public.careers(status);
CREATE INDEX IF NOT EXISTS idx_careers_department ON public.careers(department);

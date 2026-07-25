-- ===================================================
-- YMUTE Platform – Unified Admin & Feature Migration
-- ===================================================
-- 💡 RUN THIS FILE in the Supabase SQL Editor
-- This file combines ALL previous additions safely.
-- ===================================================

-- 1. EXTEND USERS TABLE
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 2. EXTEND JOBS TABLE
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT TRUE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. EXTEND NOTIFICATIONS TABLE
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- 4. CREATE REPORTS TABLE (Moderation)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'job', 'post', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Platform Settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('registration_enabled', 'true', 'Allow new user registrations'),
  ('caster_registration_enabled', 'true', 'Allow new caster registrations'),
  ('company_registration_enabled', 'true', 'Allow new company registrations'),
  ('job_posting_limit', '10', 'Max active jobs per company'),
  ('commission_percent', '10', 'Platform commission percentage'),
  ('require_job_approval', 'false', 'Admin must approve jobs before going live'),
  ('feature_community', 'true', 'Enable community section'),
  ('feature_games', 'true', 'Enable games section')
ON CONFLICT (key) DO NOTHING;

-- 6. CREATE COMMUNITY TABLES
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REFRESH ROLE CONSTRAINT
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('caster', 'company', 'user', 'admin'));

-- 8. ENABLE RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 9. CREATE POLICIES SAFELY
DO $$
BEGIN
  -- Reports
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can create reports') THEN
    CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can view own reports') THEN
    CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);
  END IF;

  -- Settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'Anyone can read settings') THEN
    CREATE POLICY "Anyone can read settings" ON public.platform_settings FOR SELECT USING (true);
  END IF;

  -- Posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Anyone can view posts') THEN
    CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can create posts') THEN
    CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Users can delete own posts') THEN
    CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Anyone can view comments') THEN
    CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create comments') THEN
    CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 10. REFRESH TRIGGER MECHANISM
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

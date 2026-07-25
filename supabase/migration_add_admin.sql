-- =========================================
-- YMUTE Platform – Admin Role Migration
-- Run this INSTEAD of schema.sql if you 
-- already ran schema.sql before.
-- =========================================

-- Step 1: Drop old role check constraint and re-add with 'admin' included
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('caster', 'company', 'user', 'admin'));

-- Step 2: Add community/moderation columns if they don't exist yet
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Step 3: Extend notifications table for admin actions
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

-- Step 4: Add community posts table if not exists
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Add comments table if not exists
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Enable RLS on new tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Step 7: Add RLS policies for new tables (safe with IF NOT EXISTS workaround)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Anyone can view posts'
  ) THEN
    CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can create posts'
  ) THEN
    CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Anyone can view comments'
  ) THEN
    CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' AND policyname = 'Users can create comments'
  ) THEN
    CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Step 8: Update trigger function to also accept 'admin' role
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: Initial Core Marketplace Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('caster', 'company', 'user', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  languages TEXT[],
  domains TEXT[],
  audio_sample_url TEXT,
  rating NUMERIC DEFAULT 0.0,
  company_name TEXT,
  company_logo_url TEXT,
  company_verification_doc_url TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  domain TEXT,
  language TEXT,
  budget TEXT,
  event_date DATE,
  event_duration TEXT,
  event_mode TEXT DEFAULT 'online',
  location TEXT,
  description TEXT,
  casters_needed INTEGER DEFAULT 1,
  payment_type TEXT DEFAULT 'fixed',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  caster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, caster_id)
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  caster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RATINGS TABLE
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caster_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADERBOARD TABLE
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- JOBS POLICIES
CREATE POLICY "Anyone can view open jobs" ON public.jobs FOR SELECT USING (status != 'draft');
CREATE POLICY "Companies can insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = company_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'company'));
CREATE POLICY "Companies can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Companies can view their draft jobs" ON public.jobs FOR SELECT USING (auth.uid() = company_id);

-- APPLICATIONS POLICIES
CREATE POLICY "Casters can view their own applications" ON public.applications FOR SELECT USING (auth.uid() = caster_id);
CREATE POLICY "Companies can view applications for their jobs" ON public.applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()));
CREATE POLICY "Casters can submit applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = caster_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'caster'));
CREATE POLICY "Companies can update application status" ON public.applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()));

-- PAYMENTS POLICIES
CREATE POLICY "Casters can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = caster_id);
CREATE POLICY "Companies can view payments for their jobs" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND company_id = auth.uid()));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update read status of their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- RATINGS POLICIES
CREATE POLICY "Anyone can view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can submit ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- LEADERBOARD POLICIES
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can update their own leaderboard score" ON public.leaderboard FOR UPDATE USING (auth.uid() = user_id);

-- TRIGGER: Auto-insert user profile on signup
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

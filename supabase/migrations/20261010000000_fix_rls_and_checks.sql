-- Fix missing WITH CHECK on UPDATE policies + remove public leaderboard self-update.
-- Safe to run multiple times (drops before create).

-- Jobs: owners only, cannot reassign company_id
DROP POLICY IF EXISTS "Companies can update their own jobs" ON public.jobs;
CREATE POLICY "Companies can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = company_id)
  WITH CHECK (auth.uid() = company_id);

-- Applications: locked by RLS to service_role via API; keep owner checks tight where used.
-- (No direct client updates allowed — API uses admin client after ownership check.)

-- Notifications: users can only touch their own rows, cannot reassign user_id
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard: remove self-update (admin/service_role only via API)
DROP POLICY IF EXISTS "Users can update their own leaderboard score" ON public.leaderboard;

-- Careers admin full access: add WITH CHECK so INSERT/UPDATE work correctly
DROP POLICY IF EXISTS "Admins have full access to careers" ON public.careers;
CREATE POLICY "Admins have full access to careers"
  ON public.careers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Jobs public read: only open jobs (not closed/draft)
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
CREATE POLICY "Anyone can view open jobs"
  ON public.jobs FOR SELECT USING (status = 'open');

-- Messages: require non-empty content at DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_nonempty_check'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_nonempty_check
      CHECK (message_text IS NOT NULL OR media_url IS NOT NULL);
  END IF;
END $$;

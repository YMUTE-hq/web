-- =========================================
-- YMUTE Platform – Chat System Schema
-- Run this in the Supabase SQL Editor
-- =========================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'job', 'support')),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_members table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT,
  media_url TEXT,
  seen BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Conversations Policies
CREATE POLICY "Users can view their own conversations" 
  ON public.conversations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id = public.conversations.id 
      AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Conversation Members Policies
CREATE POLICY "Users can view conversation members" 
  ON public.conversation_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm 
      WHERE cm.conversation_id = public.conversation_members.conversation_id 
      AND cm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id = public.messages.conversation_id 
      AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =========================================
-- ENABLE REALTIME
-- =========================================

-- Enable Replica Identity Full for messages to ensure all data is available in Realtime streams
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add table to the supabase_realtime publication to enable subscriptions
-- Note: In Supabase dashboard, this can also be done via Database -> Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

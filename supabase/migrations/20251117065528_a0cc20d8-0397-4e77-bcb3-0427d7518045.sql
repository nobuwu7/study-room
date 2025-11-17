-- Create enum types for study session tracking
CREATE TYPE public.session_type AS ENUM ('solo', 'with_friends');
CREATE TYPE public.break_type AS ENUM ('none', 'light', 'heavy');
CREATE TYPE public.energy_level AS ENUM ('none', 'low', 'high');

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type public.session_type NOT NULL DEFAULT 'solo',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  break_type public.break_type NOT NULL DEFAULT 'none',
  energy_level public.energy_level NOT NULL DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON public.study_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- Drop existing profiles table and recreate with multi-profile support
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create new profiles table that supports multiple profiles per user
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Add profile_id to study_sessions
ALTER TABLE public.study_sessions 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to tasks
ALTER TABLE public.tasks 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to study_schedules
ALTER TABLE public.study_schedules 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to library_items
ALTER TABLE public.library_items 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to mental_health_bookmarks
ALTER TABLE public.mental_health_bookmarks 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to library_tags
ALTER TABLE public.library_tags 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add profile_id to collaboration_tags
ALTER TABLE public.collaboration_tags 
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies for study_sessions
DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can create their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can delete their own study sessions" ON public.study_sessions;

CREATE POLICY "Users can view their profile study sessions"
  ON public.study_sessions FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their profile study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their profile study sessions"
  ON public.study_sessions FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile study sessions"
  ON public.study_sessions FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can view their profile tasks"
  ON public.tasks FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their profile tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their profile tasks"
  ON public.tasks FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile tasks"
  ON public.tasks FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for study_schedules
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.study_schedules;
DROP POLICY IF EXISTS "Users can create their own schedules" ON public.study_schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.study_schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.study_schedules;

CREATE POLICY "Users can view their profile schedules"
  ON public.study_schedules FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their profile schedules"
  ON public.study_schedules FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their profile schedules"
  ON public.study_schedules FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile schedules"
  ON public.study_schedules FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for library_items
DROP POLICY IF EXISTS "Users can view their own library items" ON public.library_items;
DROP POLICY IF EXISTS "Users can create library items" ON public.library_items;
DROP POLICY IF EXISTS "Users can update their own library items" ON public.library_items;
DROP POLICY IF EXISTS "Users can delete their own library items" ON public.library_items;

CREATE POLICY "Users can view their profile library items"
  ON public.library_items FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR 
         (visibility = 'group' AND group_id IS NOT NULL AND is_group_member(auth.uid(), group_id)));

CREATE POLICY "Users can create their profile library items"
  ON public.library_items FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
              ((visibility = 'personal') OR 
               (visibility = 'group' AND group_id IS NOT NULL AND is_group_member(auth.uid(), group_id))));

CREATE POLICY "Users can update their profile library items"
  ON public.library_items FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile library items"
  ON public.library_items FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for mental_health_bookmarks
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.mental_health_bookmarks;
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.mental_health_bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.mental_health_bookmarks;

CREATE POLICY "Users can view their profile bookmarks"
  ON public.mental_health_bookmarks FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their profile bookmarks"
  ON public.mental_health_bookmarks FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile bookmarks"
  ON public.mental_health_bookmarks FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for library_tags
DROP POLICY IF EXISTS "Users can view all tags" ON public.library_tags;
DROP POLICY IF EXISTS "Users can create tags" ON public.library_tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.library_tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.library_tags;

CREATE POLICY "Users can view their profile tags"
  ON public.library_tags FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their profile tags"
  ON public.library_tags FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their profile tags"
  ON public.library_tags FOR UPDATE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile tags"
  ON public.library_tags FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update RLS policies for collaboration_tags
DROP POLICY IF EXISTS "Users can view tags they created or collaborate on" ON public.collaboration_tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.collaboration_tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.collaboration_tags;

CREATE POLICY "Users can view their profile collaboration tags"
  ON public.collaboration_tags FOR SELECT
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
         (EXISTS (SELECT 1 FROM tag_collaborators 
                  WHERE tag_collaborators.tag_id = collaboration_tags.id 
                  AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid()))));

CREATE POLICY "Users can create their profile collaboration tags"
  ON public.collaboration_tags FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their profile collaboration tags"
  ON public.collaboration_tags FOR DELETE
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Update handle_new_user function to create a default profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, profile_name, is_active)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Default Profile'), true);
  RETURN NEW;
END;
$$;

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
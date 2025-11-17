-- Create table for collaboration tags
CREATE TABLE IF NOT EXISTS public.collaboration_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, created_by)
);

-- Create table for tag collaborators (who can access resources with this tag)
CREATE TABLE IF NOT EXISTS public.tag_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.collaboration_tags(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('viewer', 'editor', 'admin')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tag_id, user_email)
);

-- Create table for tagged resources
CREATE TABLE IF NOT EXISTS public.tagged_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.collaboration_tags(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('note', 'link', 'task')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaboration_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagged_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collaboration_tags
CREATE POLICY "Users can create their own tags"
  ON public.collaboration_tags FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view tags they created or collaborate on"
  ON public.collaboration_tags FOR SELECT
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.tag_collaborators
      WHERE tag_collaborators.tag_id = collaboration_tags.id
      AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own tags"
  ON public.collaboration_tags FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for tag_collaborators
CREATE POLICY "Tag creators and admins can invite collaborators"
  ON public.tag_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by AND (
      EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.tag_collaborators tc
        WHERE tc.tag_id = tag_collaborators.tag_id
        AND tc.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND tc.access_level = 'admin'
      )
    )
  );

CREATE POLICY "Users can view collaborators of their tags"
  ON public.tag_collaborators FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Tag creators and admins can remove collaborators"
  ON public.tag_collaborators FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tag_collaborators tc
      WHERE tc.tag_id = tag_collaborators.tag_id
      AND tc.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND tc.access_level = 'admin'
    )
  );

-- RLS Policies for tagged_resources
CREATE POLICY "Users with access can view tagged resources"
  ON public.tagged_resources FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tag_collaborators
      WHERE tag_collaborators.tag_id = tagged_resources.tag_id
      AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Editors and admins can create resources"
  ON public.tagged_resources FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND (
      EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.tag_collaborators
        WHERE tag_collaborators.tag_id = tagged_resources.tag_id
        AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND tag_collaborators.access_level IN ('editor', 'admin')
      )
    )
  );

CREATE POLICY "Editors and admins can update resources"
  ON public.tagged_resources FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tag_collaborators
      WHERE tag_collaborators.tag_id = tagged_resources.tag_id
      AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND tag_collaborators.access_level IN ('editor', 'admin')
    )
  );

CREATE POLICY "Creators, editors and admins can delete resources"
  ON public.tagged_resources FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.collaboration_tags WHERE id = tag_id AND created_by = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tag_collaborators
      WHERE tag_collaborators.tag_id = tagged_resources.tag_id
      AND tag_collaborators.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND tag_collaborators.access_level IN ('editor', 'admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_tagged_resources_updated_at
  BEFORE UPDATE ON public.tagged_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
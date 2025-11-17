-- Create library items table
CREATE TABLE public.library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'article', 'video', 'document', 'link', 'note')),
  visibility TEXT NOT NULL DEFAULT 'personal' CHECK (visibility IN ('personal', 'group')),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create library tags table
CREATE TABLE public.library_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('subject', 'course', 'custom')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for item-tag relationships
CREATE TABLE public.library_item_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.library_tags(id) ON DELETE CASCADE,
  UNIQUE(item_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_item_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_items
CREATE POLICY "Users can view their own library items"
  ON public.library_items FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      visibility = 'group'
      AND EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_members.group_id = library_items.group_id
        AND group_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create library items"
  ON public.library_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      visibility = 'personal'
      OR (
        visibility = 'group'
        AND EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_members.group_id = library_items.group_id
          AND group_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own library items"
  ON public.library_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items"
  ON public.library_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for library_tags
CREATE POLICY "Users can view all tags"
  ON public.library_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can create tags"
  ON public.library_tags FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own tags"
  ON public.library_tags FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tags"
  ON public.library_tags FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for library_item_tags
CREATE POLICY "Users can view item tags for accessible items"
  ON public.library_item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.library_items
      WHERE library_items.id = library_item_tags.item_id
      AND (
        library_items.user_id = auth.uid()
        OR (
          library_items.visibility = 'group'
          AND EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = library_items.group_id
            AND group_members.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can add tags to their own items"
  ON public.library_item_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.library_items
      WHERE library_items.id = library_item_tags.item_id
      AND library_items.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their own items"
  ON public.library_item_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.library_items
      WHERE library_items.id = library_item_tags.item_id
      AND library_items.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_item_tags;

-- Trigger for updated_at
CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON public.library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
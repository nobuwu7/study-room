-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.study_groups;
DROP POLICY IF EXISTS "Group owners and admins can update groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group owners can delete groups" ON public.study_groups;
DROP POLICY IF EXISTS "Users can join groups when invited" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can update members" ON public.group_members;
DROP POLICY IF EXISTS "Group owners and admins can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can create invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their groups" ON public.group_invitations;
DROP POLICY IF EXISTS "Group members can view shared resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Group members can create shared resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Group members can update their own resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Group members can delete their own resources" ON public.shared_resources;
DROP POLICY IF EXISTS "Users can view their own library items" ON public.library_items;
DROP POLICY IF EXISTS "Users can create library items" ON public.library_items;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
  )
$$;

-- Create security definer function to check group role
CREATE OR REPLACE FUNCTION public.has_group_role(_user_id UUID, _group_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
    AND role = _role
  )
$$;

-- Create security definer function to check if user has any admin role in group
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
    AND role IN ('owner', 'admin')
  )
$$;

-- Recreate group_members policies using security definer functions
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can join groups when invited"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.group_invitations
        WHERE group_invitations.group_id = group_members.group_id
        AND group_invitations.invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND group_invitations.status = 'pending'
      )
      OR EXISTS (
        SELECT 1 FROM public.study_groups
        WHERE study_groups.id = group_members.group_id
        AND study_groups.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Group owners and admins can update members"
  ON public.group_members FOR UPDATE
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group owners and admins can remove members"
  ON public.group_members FOR DELETE
  USING (
    public.is_group_admin(auth.uid(), group_id)
    OR user_id = auth.uid()
  );

-- Recreate study_groups policies
CREATE POLICY "Users can view groups they are members of"
  ON public.study_groups FOR SELECT
  USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Group owners and admins can update groups"
  ON public.study_groups FOR UPDATE
  USING (public.is_group_admin(auth.uid(), id));

CREATE POLICY "Group owners can delete groups"
  ON public.study_groups FOR DELETE
  USING (public.has_group_role(auth.uid(), id, 'owner'));

-- Recreate group_invitations policies
CREATE POLICY "Users can view invitations for their groups"
  ON public.group_invitations FOR SELECT
  USING (
    public.is_group_member(auth.uid(), group_id)
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Group members can create invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND public.is_group_member(auth.uid(), group_id)
  );

-- Recreate shared_resources policies
CREATE POLICY "Group members can view shared resources"
  ON public.shared_resources FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can create shared resources"
  ON public.shared_resources FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_group_member(auth.uid(), group_id)
  );

CREATE POLICY "Group members can update their own resources"
  ON public.shared_resources FOR UPDATE
  USING (
    auth.uid() = created_by
    OR public.is_group_admin(auth.uid(), group_id)
  );

CREATE POLICY "Group members can delete their own resources"
  ON public.shared_resources FOR DELETE
  USING (
    auth.uid() = created_by
    OR public.is_group_admin(auth.uid(), group_id)
  );

-- Recreate library_items policies
CREATE POLICY "Users can view their own library items"
  ON public.library_items FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      visibility = 'group'
      AND group_id IS NOT NULL
      AND public.is_group_member(auth.uid(), group_id)
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
        AND group_id IS NOT NULL
        AND public.is_group_member(auth.uid(), group_id)
      )
    )
  );
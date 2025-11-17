-- Create security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- Drop and recreate INSERT policy for study_groups
DROP POLICY IF EXISTS "Users can create groups" ON public.study_groups;

CREATE POLICY "Users can create groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Update group_invitations policies to use security definer function
DROP POLICY IF EXISTS "Users can view invitations for their groups" ON public.group_invitations;

CREATE POLICY "Users can view invitations for their groups"
  ON public.group_invitations FOR SELECT
  USING (
    public.is_group_member(auth.uid(), group_id)
    OR invited_email = public.get_user_email(auth.uid())
  );

-- Update group_members policy to use security definer function
DROP POLICY IF EXISTS "Users can join groups when invited" ON public.group_members;

CREATE POLICY "Users can join groups when invited"
  ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.group_invitations
        WHERE group_invitations.group_id = group_members.group_id
        AND group_invitations.invited_email = public.get_user_email(auth.uid())
        AND group_invitations.status = 'pending'
      )
      OR EXISTS (
        SELECT 1 FROM public.study_groups
        WHERE study_groups.id = group_members.group_id
        AND study_groups.created_by = auth.uid()
      )
    )
  );
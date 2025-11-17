-- Add role column to group_invitations table
ALTER TABLE public.group_invitations 
ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('viewer', 'member', 'admin'));
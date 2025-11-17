-- Create function to automatically add group creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically add the creator as an owner member
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after group creation
DROP TRIGGER IF EXISTS on_group_created ON public.study_groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();
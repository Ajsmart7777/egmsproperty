-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view vendor profiles" ON public.profiles;

-- Create a more restrictive policy - only allow viewing vendor profiles for users who have an active request assigned to that vendor
CREATE POLICY "Users can view their assigned vendor profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.maintenance_requests 
    WHERE maintenance_requests.user_id = auth.uid()
    AND maintenance_requests.vendor_user_id = profiles.user_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
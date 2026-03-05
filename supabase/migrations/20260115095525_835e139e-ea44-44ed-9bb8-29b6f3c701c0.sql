-- Allow authenticated users to view vendor specialties (needed for auto-assignment display)
CREATE POLICY "Authenticated users can view vendor specialties" 
ON public.vendor_specialties 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to view profiles of vendors (for auto-assignment)
CREATE POLICY "Authenticated users can view vendor profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = profiles.user_id 
    AND user_roles.role = 'vendor'
  )
);
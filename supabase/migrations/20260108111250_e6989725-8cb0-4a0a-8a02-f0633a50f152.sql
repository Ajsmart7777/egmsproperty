-- Create policy for vendors to view their assigned requests
CREATE POLICY "Vendors can view their assigned requests" 
ON public.maintenance_requests 
FOR SELECT 
TO authenticated
USING (vendor_user_id = auth.uid() AND has_role(auth.uid(), 'vendor'::app_role));

-- Create policy for vendors to update their assigned requests
CREATE POLICY "Vendors can update their assigned requests" 
ON public.maintenance_requests 
FOR UPDATE 
TO authenticated
USING (vendor_user_id = auth.uid() AND has_role(auth.uid(), 'vendor'::app_role));

-- Allow vendors to view comments on their assigned requests
CREATE POLICY "Vendors can view comments on their assigned requests" 
ON public.request_comments 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM maintenance_requests 
    WHERE maintenance_requests.id = request_comments.request_id 
    AND maintenance_requests.vendor_user_id = auth.uid()
  ) 
  AND has_role(auth.uid(), 'vendor'::app_role)
);

-- Allow vendors to add comments to their assigned requests
CREATE POLICY "Vendors can add comments to their assigned requests" 
ON public.request_comments 
FOR INSERT 
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) 
  AND EXISTS (
    SELECT 1 FROM maintenance_requests 
    WHERE maintenance_requests.id = request_comments.request_id 
    AND maintenance_requests.vendor_user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'vendor'::app_role)
);

-- Allow vendors to view updates on their assigned requests
CREATE POLICY "Vendors can view updates on their assigned requests" 
ON public.request_updates 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM maintenance_requests 
    WHERE maintenance_requests.id = request_updates.request_id 
    AND maintenance_requests.vendor_user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'vendor'::app_role)
);

-- Allow vendors to create updates on their assigned requests
CREATE POLICY "Vendors can create updates on their assigned requests" 
ON public.request_updates 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM maintenance_requests 
    WHERE maintenance_requests.id = request_updates.request_id 
    AND maintenance_requests.vendor_user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'vendor'::app_role)
);
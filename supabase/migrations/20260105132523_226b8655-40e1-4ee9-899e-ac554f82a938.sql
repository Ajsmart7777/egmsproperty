-- Fix 1: Make request-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'request-images';

-- Fix 2: Drop public SELECT policy if it exists
DROP POLICY IF EXISTS "Anyone can view request images" ON storage.objects;

-- Fix 3: Add authenticated user policy for viewing their own request images
CREATE POLICY "Users can view images for their requests" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'request-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 4: Add INSERT policy for request_updates to restrict to request owners only
CREATE POLICY "Owners can create updates for their requests" 
ON public.request_updates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.maintenance_requests 
    WHERE id = request_id AND user_id = auth.uid()
  )
);
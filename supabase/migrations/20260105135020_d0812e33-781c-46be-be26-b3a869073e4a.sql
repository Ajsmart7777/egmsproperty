-- Fix 1: Storage bucket - make public with authenticated-only access
-- This allows getPublicUrl() to work while still requiring authentication
UPDATE storage.buckets SET public = true WHERE id = 'request-images';

-- Drop the existing restrictive view policy
DROP POLICY IF EXISTS "Users can view images for their requests" ON storage.objects;

-- Create authenticated-only view policy for request images
CREATE POLICY "Authenticated users can view request images" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'request-images' AND 
  auth.role() = 'authenticated'
);

-- Fix 2: Profiles table - require authentication for all operations
-- Update SELECT policy to require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id
);

-- Update INSERT policy to require authentication
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id
);

-- Update UPDATE policy to require authentication
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id
);
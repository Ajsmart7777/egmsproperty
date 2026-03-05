-- Add 'vendor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Add vendor_user_id column to maintenance_requests
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS vendor_user_id uuid REFERENCES auth.users(id);
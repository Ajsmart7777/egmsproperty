-- Add notification preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_push boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_status_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_comments boolean DEFAULT true;
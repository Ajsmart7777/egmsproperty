-- Add property/unit columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS building text,
ADD COLUMN IF NOT EXISTS apartment text;
-- Add unit_id column to profiles table to link tenants to units
ALTER TABLE public.profiles 
ADD COLUMN unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_profiles_unit_id ON public.profiles(unit_id);
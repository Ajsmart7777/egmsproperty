-- Create vendor_specialties table to link vendors to issue types
CREATE TABLE public.vendor_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty)
);

-- Enable RLS
ALTER TABLE public.vendor_specialties ENABLE ROW LEVEL SECURITY;

-- Admins can manage vendor specialties
CREATE POLICY "Admins can manage vendor specialties"
ON public.vendor_specialties
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Vendors can view their own specialties
CREATE POLICY "Vendors can view their own specialties"
ON public.vendor_specialties
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
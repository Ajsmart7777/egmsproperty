-- Create issue_types table
CREATE TABLE public.issue_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text DEFAULT 'wrench',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create priority_levels table
CREATE TABLE public.priority_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6b7280',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for issue_types
CREATE POLICY "Authenticated users can view active issue types"
ON public.issue_types FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can view all issue types"
ON public.issue_types FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage issue types"
ON public.issue_types FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for priority_levels
CREATE POLICY "Authenticated users can view active priority levels"
ON public.priority_levels FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can view all priority levels"
ON public.priority_levels FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage priority levels"
ON public.priority_levels FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default issue types
INSERT INTO public.issue_types (name, icon, display_order) VALUES
('Plumbing', 'droplet', 1),
('Electrical', 'zap', 2),
('Cleaning', 'sparkles', 3),
('Structural', 'building', 4),
('Others', 'more-horizontal', 5);

-- Insert default priority levels
INSERT INTO public.priority_levels (name, color, display_order) VALUES
('Low', '#22c55e', 1),
('Medium', '#f59e0b', 2),
('High', '#ef4444', 3);

-- Add triggers for updated_at
CREATE TRIGGER update_issue_types_updated_at
BEFORE UPDATE ON public.issue_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priority_levels_updated_at
BEFORE UPDATE ON public.priority_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
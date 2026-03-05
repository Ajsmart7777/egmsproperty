-- Fix 1: Add input validation constraints for maintenance_requests
ALTER TABLE maintenance_requests 
  ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
  ADD CONSTRAINT description_length CHECK (char_length(description) BETWEEN 1 AND 5000),
  ADD CONSTRAINT building_length CHECK (char_length(building) BETWEEN 1 AND 200),
  ADD CONSTRAINT apartment_length CHECK (char_length(apartment) BETWEEN 1 AND 100),
  ADD CONSTRAINT issue_type_valid CHECK (issue_type IN ('plumbing', 'electrical', 'cleaning', 'structural', 'others'));

-- Fix 2: Prevent is_staff spoofing - force is_staff to false since staff management isn't implemented yet
-- This prevents users from setting is_staff=true via modified client code
ALTER TABLE request_comments
  ADD CONSTRAINT is_staff_must_be_false CHECK (is_staff = false);

-- Add length constraints for comments too
ALTER TABLE request_comments
  ADD CONSTRAINT message_length CHECK (message IS NULL OR char_length(message) <= 2000),
  ADD CONSTRAINT author_length CHECK (char_length(author) BETWEEN 1 AND 100);
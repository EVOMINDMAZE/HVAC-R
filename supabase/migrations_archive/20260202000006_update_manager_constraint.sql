-- Update Constraint to include 'manager' role
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS check_role_mapping;

ALTER TABLE public.user_roles ADD CONSTRAINT check_role_mapping CHECK (
    -- Admin/Manager/Student/Technician must belong to a company (Business side)
    ((role = 'admin' OR role = 'manager' OR role = 'student' OR role = 'technician' OR role = 'tech') AND company_id IS NOT NULL) 
    OR
    -- Clients must belong to a client profile
    (role = 'client' AND client_id IS NOT NULL)
);

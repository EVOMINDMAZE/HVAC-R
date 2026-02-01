-- Allow authenticated users (or just admins) to view all technicians
-- This is necessary because the default RLS only allows users to view their OWN role.
-- For the Dispatch Flow test (and general dispatching), admins need to see the pool of available technicians.

CREATE POLICY "View Technicians" ON public.user_roles
AS PERMISSIVE FOR SELECT
TO authenticated
USING (role IN ('technician', 'tech'));

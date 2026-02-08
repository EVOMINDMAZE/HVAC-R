-- Allow Admins to update user_roles (e.g. changing 'tech' to 'manager')
-- Policy requires that the executing user is an 'admin' and belongs to the same company as the target user.

CREATE POLICY "Admins can update roles for their company" ON public.user_roles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles admin_role
    WHERE admin_role.user_id = auth.uid()
    AND admin_role.role = 'admin'
    AND admin_role.company_id = public.user_roles.company_id
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles admin_role
    WHERE admin_role.user_id = auth.uid()
    AND admin_role.role = 'admin'
    AND admin_role.company_id = public.user_roles.company_id
  )
);

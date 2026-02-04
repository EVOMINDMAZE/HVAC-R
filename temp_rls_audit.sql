-- RLS and helpers audit script
-- Goal: verify RLS is enabled and policies exist for critical tables; check helper functions

-- 1) Check RLS enabled status on key tables
SELECT 'RLS Check for public.jobs' AS description,
       schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('jobs','clients','assets','calculations','companies','user_roles')
ORDER BY tablename;

-- 2) Check helper functions exist and are SECURITY DEFINER
SELECT 'Helper Functions check' AS description,
       proname, prosrc, prosecdefiner
FROM pg_proc
WHERE pronamespace = 'public'
  AND proname IN ('get_my_role','get_my_company_id');

-- 3) List RLS policies on key tables
SELECT 'RLS Policies for public.jobs' AS description,
       schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs','clients','assets','calculations','companies','user_roles')
ORDER BY tablename, policyname;

-- 4) Spot-check a few auth.uid() usages in policy definitions (migration snippets)
SELECT 'Policy auth.uid usage (sample)' AS description,
       'sample_policy_check' AS check_name,
       pg_get_viewdef() AS policy_definition
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'jobs'
  AND policyname LIKE '%RBAC%'
LIMIT 3;
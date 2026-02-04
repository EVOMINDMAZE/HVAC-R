
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Find the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'hanniz.riadus@outlook.com';
    
    RAISE NOTICE 'Testing for User ID: %', target_user_id;

    -- 2. Simulate Auth Context
    -- We can't actually "set active role" inside a DO block easily across transactions in Supabase SQL editor typically,
    -- but we can call the function if we manually pass params or just inspect the query logic directly.
    
    -- Actually, let's just RUN the query logic manually using that ID to see what it sees.
    -- This mirrors the RPC body exactly.
    
    RAISE NOTICE '--- QUERY RESULTS ---';
    
    FOR target_user_id IN 
        -- 1. Active Roles
        SELECT c.id
        FROM public.companies c
        JOIN public.user_roles ur ON c.id = ur.company_id
        WHERE ur.user_id = target_user_id
        
        UNION
        
        -- 2. Owned Companies
        SELECT c.id
        FROM public.companies c
        WHERE c.user_id = target_user_id
    LOOP
        RAISE NOTICE 'Found Company ID: %', target_user_id;
    END LOOP;

END $$;

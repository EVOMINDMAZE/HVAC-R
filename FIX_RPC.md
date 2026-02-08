# Fix get_my_companies RPC Function

## Issue
The `get_my_companies()` RPC returns empty even though the user has companies.

## Solution
Run the following SQL in Supabase Dashboard SQL Editor:

```sql
-- Drop existing function
DROP FUNCTION IF EXISTS public.get_my_companies();

-- Recreate with correct definition
CREATE OR REPLACE FUNCTION public.get_my_companies()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, ur.role::TEXT
    FROM public.companies c
    INNER JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    ORDER BY c.name ASC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_my_companies() TO authenticated, anon;

-- Test
SELECT * FROM public.get_my_companies();
```

## Alternative: Test with service role directly
Run this TypeScript script:
```
npx tsx scripts/verify_data.ts
```

Expected output for admin user:
- Companies owned: 1 (HVAC Pro Services)
- User roles: 1 (admin for HVAC Pro Services)

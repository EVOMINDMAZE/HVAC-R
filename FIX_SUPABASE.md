# Fix Supabase RPC Functions

## Important Note
This fix should be applied to both:
1. **Local Docker development instance** (if using `supabase start` for local development)
2. **Cloud production instance** (if using cloud Supabase for production)

## Problem
`get_my_companies()` RPC returns empty because `auth.uid()` returns NULL in SECURITY DEFINER context.

## Solution - Manual Fix Required

### Step 1: Open Supabase SQL Editor

#### For Cloud Production:
Go to: https://rxqflxmzsqhqrzffcsej.supabase.co/project/_/sql

#### For Local Docker Development:
Open your browser to: http://localhost:54323/project/_/sql

### Step 2: Copy and Run This SQL
```sql
-- Fix get_my_companies to accept user_id parameter
DROP FUNCTION IF EXISTS public.get_my_companies();

CREATE OR REPLACE FUNCTION public.get_my_companies(p_user_id UUID DEFAULT NULL::UUID)
RETURNS TABLE (company_id UUID, company_name TEXT, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  
  RETURN QUERY
  SELECT c.id, c.name, ur.role::TEXT
  FROM public.companies c
  INNER JOIN public.user_roles ur ON c.id = ur.company_id
  WHERE ur.user_id = v_user_id
  ORDER BY c.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_companies(UUID) TO authenticated, anon;

-- Also fix get_my_company_id
DROP FUNCTION IF EXISTS public.get_my_company_id();

CREATE OR REPLACE FUNCTION public.get_my_company_id(p_user_id UUID DEFAULT NULL::UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_active_id UUID;
  v_valid_id UUID;
BEGIN
  IF p_user_id IS NOT NULL THEN
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;

  SELECT (raw_user_meta_data->>'active_company_id')::UUID
  INTO v_active_id
  FROM auth.users
  WHERE id = v_user_id;

  IF v_active_id IS NOT NULL THEN
      SELECT company_id INTO v_valid_id
      FROM public.user_roles
      WHERE user_id = v_user_id AND company_id = v_active_id;
      IF v_valid_id IS NOT NULL THEN RETURN v_valid_id; END IF;
  END IF;

  SELECT company_id INTO v_valid_id
  FROM public.user_roles
  WHERE user_id = v_user_id
  ORDER BY created_at ASC LIMIT 1;

  IF v_valid_id IS NULL THEN
      SELECT id INTO v_valid_id
      FROM public.companies
      WHERE user_id = v_user_id LIMIT 1;
  END IF;

  RETURN v_valid_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_company_id(UUID) TO authenticated, anon;
```

### Step 3: Verify the Fix
```sql
SELECT * FROM public.get_my_companies('e74f92ab-9c58-45d7-9a0c-4adbe6460f65');
```

Expected: 1 row with HVAC Pro Services company.

### Step 4: Update Frontend
The frontend has been updated to pass user_id:
```typescript
await supabase.rpc('get_my_companies', { p_user_id: user.id });
```

## Quick Link
Open directly: https://rxqflxmzsqhqrzffcsej.supabase.co/project/_/sql

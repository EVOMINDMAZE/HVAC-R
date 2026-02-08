
-- 1. Update Enum
-- separate transaction required often
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'technician';

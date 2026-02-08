-- Performance Optimization: Add composite index on calculations table
-- This addresses the 60.5% query execution time being spent on calculations queries
-- The table has 44,353 sequential scans for only 154 rows

CREATE INDEX IF NOT EXISTS idx_calculations_user_created 
ON public.calculations(user_id, created_at DESC);

-- Also create an index on created_at alone for non-user-filtered queries
CREATE INDEX IF NOT EXISTS idx_calculations_created 
ON public.calculations(created_at DESC);

-- Enable RLS
ALTER TABLE IF EXISTS workflow_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own requests (Required for Supabase Realtime to send events to the client)
DROP POLICY IF EXISTS "Users can view own workflow_requests" ON workflow_requests;
CREATE POLICY "Users can view own workflow_requests"
ON workflow_requests FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- Allow users to create requests
DROP POLICY IF EXISTS "Users can insert own workflow_requests" ON workflow_requests;
CREATE POLICY "Users can insert own workflow_requests"
ON workflow_requests FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = user_id );

-- Allow the service role to do everything (implicit, but good to remember)
-- Service role bypasses RLS.

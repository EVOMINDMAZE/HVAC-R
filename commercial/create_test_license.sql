-- 1. Replace 'YOUR_USER_ID_HERE' with your actual User UUID from Authentication > Users
--    Example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
WITH new_license AS (
  INSERT INTO public.licenses (user_id, status, plan_tier)
  VALUES ('YOUR_USER_ID_HERE', 'active', 'pro')
  RETURNING key
)
SELECT key FROM new_license;

-- Copy the returned UUID 'key' to use in your n8n workflow or test script!

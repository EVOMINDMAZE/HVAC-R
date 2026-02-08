-- SQL to run in Supabase Studio SQL Editor
-- Get all users from auth.users table

SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    phone,
    raw_user_meta_data as metadata,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Unconfirmed'
    END as email_status,
    CASE 
        WHEN last_sign_in_at IS NULL THEN 'Never signed in'
        ELSE 'Has signed in'
    END as sign_in_status
FROM auth.users 
ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM auth.users;

-- List users by creation date
SELECT 
    DATE(created_at) as signup_date,
    COUNT(*) as users_count
FROM auth.users
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Check for specific test users
SELECT * FROM auth.users 
WHERE email IN (
    'admin@admin.com',
    'manager@demo.com', 
    'tech@test.com',
    'client@test.com',
    'student@test.com',
    'hanniz.riadus@outlook.com',
    'test@example.com'
)
ORDER BY email;
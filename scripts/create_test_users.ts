
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://rxqflxmzsqhqrzffcsej.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const users = [
    { email: 'student@test.com', role: 'student', password: 'Password123!' },
    { email: 'tech@test.com', role: 'technician', password: 'Password123!' },
    { email: 'client@test.com', role: 'client', password: 'Password123!' },
    // Also updating the admin for good measure, if you want
    { email: 'admin@admin.com', role: 'admin', password: 'ThermoAdmin$2026!' }
];

async function run() {
    for (const u of users) {
        console.log(`\nProcessing user: ${u.email} [${u.role}]`);
        // 1. Create or Find User
        let userId;

        // Try creating
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { name: u.role.toUpperCase() }
        });

        if (createData.user) {
            console.log(`Created new user: ${createData.user.id}`);
            userId = createData.user.id;
        } else if (createError?.message?.includes("already registered") || createError?.status === 422) {
            console.log("User already exists. Finding ID...");
            // Hack: List users (limit 100) and find by email because signInWithPassword acts up in admin scripts sometimes
            const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error("Failed to list users:", listError);
                continue;
            }
            const found = allUsers.find(x => x.email === u.email);
            if (found) {
                userId = found.id;
                console.log(`Found ID: ${userId}`);
            } else {
                console.error("Could not find user in list even though it exists.");
                continue;
            }
        } else {
            console.error("Failed to create user:", createError);
            continue;
        }

        // 2. Set Role
        if (userId) {
            // Check if user_roles table exists by trying to insert
            const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id' });

            if (roleError) {
                console.error("Error setting role:", roleError);
                if (roleError.code === '42P01') {
                    console.error("CRITICAL: 'user_roles' table does not exist!");
                }
            } else {
                console.log(`Successfully assigned role '${u.role}' to user.`);
            }
        }
    }
}

run();

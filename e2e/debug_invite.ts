
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWZseG16c3FocXJ6ZmZjc2VqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjYxMCwiZXhwIjoyMDY4ODgyNjEwfQ.qBMpMscAPAXRXJYRyIkuqO4a9QDUb2lSYgpI2voNBJ0";

const supabase = createClient(supabaseUrl, serviceRoleKey); // Using service role to sign in as admin for test

console.log("Signing in as admin...");
const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: 'password1'
});

if (loginError || !session) {
    console.error("Login failed:", loginError);
    process.exit(1);
}

const token = session.access_token;
const email = "test@example.com";

// TEST RPC DIRECTLY
console.log(`Testing RPC get_user_id_by_email for ${email}...`);
const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_id_by_email', { user_email: email });
console.log("RPC Data:", rpcData);
console.log("RPC Error:", rpcError);

console.log(`Invoking invite-user function for ${email}...`);
const { data, error } = await supabase.functions.invoke('invite-user', {
    body: {
        email: email,
        role: 'technician',
        full_name: 'Debug Test User'
    },
    headers: {
        Authorization: `Bearer ${token}`
    }
});

console.log("Function Response Data:", data);
console.log("Function Response Error:", error);

if (error) {
    console.error("Function Invocation Failed!");
} else if (data && data.error) {
    console.error("Function returned application error:", data.error);
} else {
    console.log("Function verification SUCCESS!");
}

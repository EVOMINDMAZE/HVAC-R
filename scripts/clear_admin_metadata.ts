import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const admin = users.find(u => u.email === "admin@admin.com");
    if (!admin) throw new Error("Admin not found");

    console.log("Clearing active_company_id for admin...");
    const { error } = await supabase.auth.admin.updateUserById(admin.id, {
        user_metadata: { ...admin.user_metadata, active_company_id: null }
    });
    
    if (error) console.error("Error:", error);
    else console.log("Success! Admin metadata updated.");
}

run();

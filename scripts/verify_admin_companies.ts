import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const admin = users.find(u => u.email === "admin@admin.com");
    
    if (!admin) {
        console.log("Admin not found!");
        return;
    }
    
    console.log(`Admin ID: ${admin.id}`);
    
    // Check user_roles
    const { data: roles } = await supabase
        .from("user_roles")
        .select("*, companies(name)")
        .eq("user_id", admin.id);
        
    console.log("Roles:", JSON.stringify(roles, null, 2));
    
    // Check owned companies
    const { data: owned } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", admin.id);
        
    console.log("Owned Companies:", JSON.stringify(owned, null, 2));
}

run();

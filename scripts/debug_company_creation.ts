import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log("Checking for Demo Company...");
    const { data: existing, error: findError } = await supabase.from("companies").select("*").eq("name", "Demo Company");
    
    if (findError) {
        console.error("Find Error:", findError);
        return;
    }
    
    console.log("Found:", existing);
    
    if (!existing || existing.length === 0) {
        console.log("Creating Demo Company...");
        // Need a user_id for the company owner? 
        // In the schema, user_id might be required or nullable?
        // Let's use the admin's ID.
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const admin = users.find(u => u.email === "admin@admin.com");
        
        if (!admin) { console.error("Admin not found"); return; }

        const { data: newComp, error: createError } = await supabase.from("companies").insert({
            name: "Demo Company",
            subscription_tier: "free",
            user_id: admin.id
        }).select().single();
        
        if (createError) {
            console.error("Create Error:", createError);
        } else {
            console.log("Created:", newComp);
        }
    }
}

run();

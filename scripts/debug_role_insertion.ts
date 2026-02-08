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

    // 1. Get current role
    const { data: currentRole } = await supabase.from("user_roles").select("*").eq("user_id", admin.id);
    console.log("Current Roles:", currentRole);

    // 2. Try to insert a dummy role for a non-existent company (just to check constraint)
    // Or better, find "Demo Company"
    const { data: demo } = await supabase.from("companies").select("id").eq("name", "Demo Company").single();
    if (!demo) {
        console.log("Demo Company not found, creating it...");
        const { data: newDemo } = await supabase.from("companies").insert({
            name: "Demo Company",
            subscription_tier: "free"
        }).select().single();
        console.log("Created Demo Company:", newDemo.id);
        // Retry insert
        await insertRole(admin.id, newDemo.id);
    } else {
        await insertRole(admin.id, demo.id);
    }
}

async function insertRole(userId: string, companyId: string) {
    console.log(`Attempting to insert role for user ${userId} and company ${companyId}`);
    const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        company_id: companyId,
        role: "admin"
    });
    
    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success!");
    }
}

run();

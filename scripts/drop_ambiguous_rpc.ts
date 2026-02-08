import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log("Dropping ambiguous function...");
    const { error } = await supabase.rpc('exec_sql', {
        sql: "DROP FUNCTION IF EXISTS public.get_my_companies(uuid);"
    });

    if (error) {
        console.error("Error dropping function:", error);
        // If exec_sql doesn't exist, we'll try a different way if possible
    } else {
        console.log("Success! Ambiguous function dropped.");
    }
}

run();

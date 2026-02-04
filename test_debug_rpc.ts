
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envLines = envFile.split('\n');
        for (const line of envLines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        }
    } catch (e) {
        console.warn("Could not load .env file", e);
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TARGET_ID = "cb65bb02-3993-455e-b05b-fb1728c3d9ee";

async function testRpc() {
    console.log(`Running debug_get_companies for ID: ${TARGET_ID}`);
    const { data, error } = await supabase.rpc('debug_get_companies', { target_user_id: TARGET_ID });

    if (error) {
        console.error("RPC Error:", error);
    } else {
        console.log("RPC Data Returned:");
        console.table(data);
    }
}

testRpc();

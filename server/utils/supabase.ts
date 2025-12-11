import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.warn("VITE_SUPABASE_URL missing.");
}
if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing. Admin operations will fail.");
}

export const supabaseAdmin =
    supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })
        : null;

export const getSupabaseClient = (authToken?: string) => {
    if (!supabaseUrl || !anonKey) return null;

    const options: any = {
        auth: { persistSession: false, autoRefreshToken: false }
    };

    if (authToken) {
        options.global = {
            headers: { Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}` }
        };
    }

    return createClient(supabaseUrl, anonKey, options);
};


import { supabaseAdmin } from "../server/utils/supabase.js";

async function checkDb() {
    console.log("Checking Supabase connection...");
    if (!supabaseAdmin) {
        console.error("Supabase Admin client not initialized (missing env vars?)");
        return;
    }

    try {
        const { count, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error querying subscription_plans:", error.message);
            if (error.message.includes("relation") && error.message.includes("does not exist")) {
                console.log("Table 'subscription_plans' does NOT exist. Migration needed.");
            }
        } else {
            console.log(`Table 'subscription_plans' exists. Count: ${count}`);
        }

    } catch (err: any) {
        console.error("Unexpected error:", err.message);
    }
}

checkDb();

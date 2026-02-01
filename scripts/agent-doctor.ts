
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

async function checkEnv() {
    console.log(`${colors.blue}🔍 Checking Environment...${colors.reset}`);
    const required = [
        "VITE_SUPABASE_URL",
        "VITE_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
    ];
    let missing = false;

    required.forEach((key) => {
        if (!process.env[key]) {
            console.log(`${colors.red}❌ Missing ${key}${colors.reset}`);
            missing = true;
        } else {
            console.log(`${colors.green}✅ ${key} is set${colors.reset}`);
        }
    });

    if (missing) {
        console.log(`${colors.yellow}💡 Tip: Check your .env file or local process environment.${colors.reset}`);
    }
    return !missing;
}

async function checkSupabase() {
    console.log(`\n${colors.blue}🔍 Checking Supabase Connectivity...${colors.reset}`);
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.log(`${colors.red}❌ Cannot check Supabase: Missing credentials.${colors.reset}`);
        return false;
    }

    const supabase = createClient(url, key);

    try {
        const { data, error } = await supabase.from('subscription_plans').select('count').limit(1);
        if (error) throw error;
        console.log(`${colors.green}✅ Supabase Cloud connection successful.${colors.reset}`);
        return true;
    } catch (err: any) {
        console.log(`${colors.red}❌ Supabase connection failed: ${err.message}${colors.reset}`);
        console.log(`${colors.yellow}💡 Tip: Check if VITE_SUPABASE_URL is correct and network is up.${colors.reset}`);
        return false;
    }
}

async function checkBuild() {
    console.log(`\n${colors.blue}🔍 Checking Build Artifacts...${colors.reset}`);
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
        console.log(`${colors.green}✅ /dist folder exists.${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  No /dist folder found. Run 'npm run build' if deploying.${colors.reset}`);
    }
}

async function main() {
    console.log(`${colors.cyan}=== 🏥 THE AGENT DOCTOR ===${colors.reset}`);
    const envOk = await checkEnv();
    const dbOk = await checkSupabase();
    await checkBuild();

    if (envOk && dbOk) {
        console.log(`\n${colors.green}✨ SYSTEM HEALTHY - Agent is ready to operate.${colors.reset}`);
    } else {
        console.log(`\n${colors.red}🩹 SYSTEM UNHEALTHY - Please address the issues above.${colors.reset}`);
        process.exit(1);
    }
}

main();

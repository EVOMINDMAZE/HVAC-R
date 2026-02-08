import { config } from "dotenv";
const result = config();
console.log("Dotenv result:", result.error ? "Error" : "Success");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Defined" : "Undefined");
console.log("Keys found in process.env:", Object.keys(process.env).filter(k => k.startsWith("VITE_")));

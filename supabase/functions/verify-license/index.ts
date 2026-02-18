import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

console.log("Verify License Function Invoked");

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { headers } = req;
  // Support license key via header (x-license-key) or body parameter
  let licenseKey = headers.get("x-license-key");
  let userId = null;

  // Fallback: Check Body if not in header
  if (!licenseKey) {
    try {
      const body = await req.json();
      licenseKey = body.license_key;
      userId = body.user_id;
    } catch (e) {
      // ignore JSON parse error
    }
  }

  if (!licenseKey && !userId) {
    return new Response(
      JSON.stringify({
        error: "Missing x-license-key header OR user_id body parameter",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  // Create Supabase Client (Service Role needed to read all licenses)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let data, error;

  if (licenseKey) {
    // Option A: Verify by Key (Direct)
    const result = await supabaseClient
      .from("licenses")
      .select("status, plan_tier")
      .eq("key", licenseKey)
      .single();
    data = result.data;
    error = result.error;
  } else if (userId) {
    // Option B: Verify by User ID (Lookup active license)
    const result = await supabaseClient
      .from("licenses")
      .select("status, plan_tier")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .single();
    data = result.data;
    error = result.error;
  }

  if (error || !data) {
    console.log(`License Check Failed for: ${licenseKey || userId}`);
    return new Response(
      JSON.stringify({ valid: false, error: "License not found or inactive" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  if (data.status !== "active") {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "License inactive",
        status: data.status,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }

  // Success
  return new Response(JSON.stringify({ valid: true, plan: data.plan_tier }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
});
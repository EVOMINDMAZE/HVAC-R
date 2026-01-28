import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

export const supabaseDiag: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceKey) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Supabase config missing on server (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)",
        });
    }

    // Basic network check: HEAD request to the Supabase URL
    let headOk = false;
    let headStatus: any = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const r = await fetch(supabaseUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        headOk = r.ok;
        headStatus = {
          status: r.status,
          url: r.url,
          headers: Object.fromEntries(r.headers),
        };
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      headStatus = { error: String(err) };
    }

    // Try to initialize Supabase client with service role and run a simple request
    let clientResult: any = null;
    try {
      const sb = createClient(supabaseUrl, serviceKey);
      // Try a health query to the REST endpoint - list tables may not be allowed; attempt selecting from pg_catalog.tables via rpc will fail
      // We'll attempt a simple request to the auth endpoint to list users (requires service role)
      try {
        // Supabase admin API via REST route; supabase-js exposes admin but may not in this context. We'll attempt a simple select on information_schema
        const { data, error, status } = await sb
          .from("pg_stat_activity" as any)
          .select("*")
          .limit(1);
        clientResult = {
          data,
          error: error ? error.message || error : null,
          status,
        };
      } catch (errInner) {
        // If above fails, fall back to a low-level fetch to the REST endpoint with the service key
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            const restUrl = supabaseUrl.endsWith("/")
              ? `${supabaseUrl}rest/v1/`
              : `${supabaseUrl}/rest/v1/`;
            const r = await fetch(restUrl, {
              method: "GET",
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
              },
              signal: controller.signal,
            });
            const text = await r.text();
            clientResult = {
              status: r.status,
              ok: r.ok,
              responsePreview: text.substring(0, 500),
            };
          } finally {
            clearTimeout(timeout);
          }
        } catch (errFetch) {
          clientResult = { error: String(errFetch) };
        }
      }
    } catch (err) {
      clientResult = { error: String(err) };
    }

    return res.json({
      success: true,
      headCheck: { ok: headOk, details: headStatus },
      clientCheck: clientResult,
    });
  } catch (error) {
    console.error("Diagnostics error:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
};

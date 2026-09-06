// kpi-stats — public counts-only KPI aggregate for the weekly digest (M&C).
// GET /functions/v1/kpi-stats ->
//   { licenses: { total, active }, triage_submissions: N, skool_subscriptions: N }
// Money signal: every paid conversion (checkout.session.completed) grants one
// `licenses` row via stripe-webhook — total/active counts ARE the revenue KPIs
// the webhook persists. No checkout-session table exists; sessions themselves
// are never stored, so they are honestly absent here rather than invented.
// Service-role SELECT, aggregates server-side; exposes COUNTS ONLY (no rows,
// no emails, no keys). CORS permissive: public, non-personal aggregates.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json({ error: "use GET" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { count: licTotal, error: e1 } = await admin
    .from("licenses")
    .select("key", { count: "exact", head: true });
  if (e1) return json({ error: "licenses: " + e1.message }, 500);

  const { count: licActive, error: e2 } = await admin
    .from("licenses")
    .select("key", { count: "exact", head: true })
    .eq("status", "active");
  if (e2) return json({ error: "licenses active: " + e2.message }, 500);

  const { count: triage, error: e3 } = await admin
    .from("triage_submissions")
    .select("id", { count: "exact", head: true });
  if (e3) return json({ error: "triage_submissions: " + e3.message }, 500);

  const { count: skool, error: e4 } = await admin
    .from("skool_subscriptions")
    .select("id", { count: "exact", head: true });
  if (e4) return json({ error: "skool_subscriptions: " + e4.message }, 500);

  return json({
    licenses: { total: licTotal ?? 0, active: licActive ?? 0 },
    triage_submissions: triage ?? 0,
    skool_subscriptions: skool ?? 0,
  });
});

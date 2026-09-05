// catalog-stats — public scan counter for the printable catalog (Phase 6).
// GET /functions/v1/catalog-stats -> { total, by_slug }
// Service-role SELECT, aggregated server-side; exposes COUNTS ONLY (no rows,
// no UA strings). Lets the live probe verify catalog-track's inserts without
// any credentials, and lets /catalog display a true counter later.
// CORS permissive: the data is public, non-personal aggregates.

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

  const { count, error } = await admin
    .from("catalog_scans")
    .select("slug", { count: "exact", head: true });
  if (error) return json({ error: error.message }, 500);

  // Volume is leaflets-in-shops, not firehose — pull slugs and aggregate here.
  const { data, error: e2 } = await admin.from("catalog_scans").select("slug");
  if (e2) return json({ error: e2.message }, 500);
  const by_slug: Record<string, number> = {};
  for (const row of data ?? []) by_slug[row.slug] = (by_slug[row.slug] ?? 0) + 1;

  return json({ total: count ?? 0, by_slug });
});

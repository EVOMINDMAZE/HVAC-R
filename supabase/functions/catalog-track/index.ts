// catalog-track — printable-sheet scan tracker (Phase 6, Catalog Outward).
// Public GET: /functions/v1/catalog-track?p=<slug>
//   1. inserts one row into public.catalog_scans (service role, bypasses RLS),
//   2. 302-redirects the scanner to the product page with UTM tags,
//   3. always answers the scanner fast, redirect even on DB error (a scan must
//      never dead-end because analytics failed).
// Slugs are validated against a fixed allowlist; anything else → 400.
// No auth, no body; UA/Referer recorded for volume stats only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SLUGS = new Set([
  "phasepoint",
  "vanclass",
  "cryovo",
  "hvac-business-platform",
]);

// Where each slug's QR sends the visitor (product home / free-tier entry).
const PRODUCT_URLS: Record<string, string> = {
  phasepoint: "https://simulateon.vercel.app",
  vanclass: "https://vanclass-app.vercel.app",
  cryovo: "https://cryovo.vercel.app",
  "hvac-business-platform": "https://thermoneural.com/try",
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.searchParams.get("p") ?? "";

  if (!SLUGS.has(slug)) {
    return new Response(JSON.stringify({ error: "unknown product" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Record best-effort; never block the redirect on analytics failure.
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { error } = await admin.from("catalog_scans").insert({
      slug,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      referer: req.headers.get("referer")?.slice(0, 300) ?? null,
    });
    // supabase-js resolves with { error } instead of throwing — log it or the
    // failure is invisible while scans still redirect (silent undercount).
    if (error) console.error("catalog-track insert failed:", error.message);
  } catch {
    // Network-level failure — redirect still answers (a scan must never dead-end).
  }

  const dest = new URL(PRODUCT_URLS[slug]);
  dest.searchParams.set("utm_source", "catalog-sheet");
  dest.searchParams.set("utm_medium", "print");
  dest.searchParams.set("utm_campaign", "thermoneural-mall");
  dest.searchParams.set("utm_content", slug);

  return new Response(null, {
    status: 302,
    headers: { Location: dest.toString() },
  });
});

import { RequestHandler } from "express";
import { supabaseAdmin } from "../utils/supabase";

export const getUserCount: RequestHandler = async (_req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase admin not configured" });
    }

    // Avoid querying auth.users in a loop; approximate "users" by distinct user_ids
    // in user_roles + company owners. This is for marketing/landing display only.
    const seen = new Set<string>();

    // Collect user_roles in pages (table size should be manageable for MVP).
    const pageSize = 1000;
    for (let offset = 0; offset < 20_000; offset += pageSize) {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Error reading user_roles for user count:", error);
        break;
      }
      if (!data || data.length === 0) break;
      for (const row of data) {
        if (row?.user_id) seen.add(String(row.user_id));
      }
      if (data.length < pageSize) break;
    }

    // Include company owners (in case some owners don't have user_roles rows).
    const { data: owners, error: ownersErr } = await supabaseAdmin
      .from("companies")
      .select("user_id");
    if (!ownersErr && owners) {
      for (const row of owners) {
        if (row?.user_id) seen.add(String(row.user_id));
      }
    }

    return res.json({
      success: true,
      count: seen.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in getUserCount:", err);
    return res.status(500).json({ error: "Failed to get user count", message });
  }
};


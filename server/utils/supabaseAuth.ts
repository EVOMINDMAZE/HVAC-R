import { RequestHandler } from "express";
import { getSupabaseClient } from "./supabase.ts";

// Supabase JWT verification middleware
export const authenticateSupabaseToken: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    console.log("Auth middleware called for:", req.path);
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Verify the JWT signature using Supabase client
    const supabase = getSupabaseClient(token);

    if (!supabase) {
      console.error("Failed to initialize Supabase client (missing env vars?)");
      return res.status(500).json({ error: "Internal configuration error" });
    }

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      console.log("Invalid token or user not found:", error?.message);
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    // Create a user object from the Supabase user
    const user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      stripe_customer_id:
        supabaseUser.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id:
        supabaseUser.user_metadata?.stripe_subscription_id || null,
      subscription_plan:
        supabaseUser.user_metadata?.subscription_plan || "free",
      subscription_status:
        supabaseUser.user_metadata?.subscription_status || "active",
    };

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Supabase authentication error:", error);
    res.status(401).json({
      error: "Authentication failed",
    });
  }
};

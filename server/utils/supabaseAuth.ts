import { RequestHandler } from "express";
import { getSupabaseClient } from "./supabase.ts";

// Supabase JWT verification middleware
export const authenticateSupabaseToken: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Verify the token using Supabase client
    // This calls the Supabase Auth API to validate the token signature and expiration
    const supabase = getSupabaseClient(token);

    if (!supabase) {
       console.error("Supabase client not initialized - missing environment variables");
       return res.status(500).json({ error: "Server configuration error" });
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.log("Invalid token:", error?.message);
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    // Create a user object from the Supabase user
    const requestUser = {
      id: user.id,
      email: user.email,
      stripe_customer_id: user.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id:
        user.user_metadata?.stripe_subscription_id || null,
      subscription_plan: user.user_metadata?.subscription_plan || "free",
      subscription_status:
        user.user_metadata?.subscription_status || "active",
    };

    // Add user to request object
    (req as any).user = requestUser;
    next();
  } catch (error) {
    console.error("Supabase authentication error:", error);
    res.status(401).json({
      error: "Authentication failed",
    });
  }
};

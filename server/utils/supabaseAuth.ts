import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getSupabaseClient } from "./supabase";

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

    // Preferred path: verify token with Supabase directly.
    const supabaseClient = getSupabaseClient(token);
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.getUser(token);
      if (!error && data?.user?.id) {
        (req as any).user = {
          id: data.user.id,
          email: data.user.email,
          stripe_customer_id: data.user.user_metadata?.stripe_customer_id || null,
          stripe_subscription_id:
            data.user.user_metadata?.stripe_subscription_id || null,
          subscription_plan: data.user.user_metadata?.subscription_plan || "free",
          subscription_status:
            data.user.user_metadata?.subscription_status || "active",
        };
        return next();
      }
      console.log("Supabase token verification failed:", error?.message || "unknown error");
    }

    // Fallback path: verify JWT locally when Supabase auth endpoint is unavailable.
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.log("No JWT secret configured for local fallback verification");
      return res.status(401).json({ error: "Invalid token" });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (verifyError: unknown) {
      const msg = verifyError instanceof Error ? verifyError.message : "Unknown error";
      console.log("JWT verification failed:", msg);
      return res.status(401).json({ error: "Invalid token signature" });
    }

    if (!decoded?.sub) {
      console.log("Invalid token structure");
      return res.status(401).json({ error: "Invalid token" });
    }

    (req as any).user = {
      id: decoded.sub,
      email: decoded.email,
      stripe_customer_id: decoded.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id: decoded.user_metadata?.stripe_subscription_id || null,
      subscription_plan: decoded.user_metadata?.subscription_plan || "free",
      subscription_status: decoded.user_metadata?.subscription_status || "active",
    };
    next();
  } catch (error) {
    console.error("Supabase authentication error:", error);
    res.status(401).json({
      error: "Authentication failed",
    });
  }
};

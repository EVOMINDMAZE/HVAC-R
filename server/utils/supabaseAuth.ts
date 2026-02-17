import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

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

    // Verify JWT signature using JWT_SECRET or SUPABASE_JWT_SECRET environment variable
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

    // Security check: Ensure strong secret in production
    if (
      !jwtSecret ||
      jwtSecret === "your_super_secret_jwt_key_change_in_production"
    ) {
      if (process.env.NODE_ENV === "production") {
        console.error(
          "FATAL: JWT_SECRET or SUPABASE_JWT_SECRET is missing or weak in production!",
        );
        return res.status(500).json({
          error: "Server configuration error",
        });
      }
      console.warn(
        "WARNING: Using default/weak JWT_SECRET (DEV ONLY). Set a strong secret in production.",
      );
    }

    let decoded: any;
    try {
      // Always verify JWT signature - no decode-only fallback for security
      // In development, if secret is missing, use fallback. In production, we would have returned 500 above if missing.
      const secretToUse = jwtSecret || "fallback-secret-change-in-production";
      decoded = jwt.verify(token, secretToUse);
    } catch (verifyError: any) {
      console.log("JWT verification failed:", verifyError.message);
      return res.status(401).json({
        error: "Invalid token signature",
      });
    }

    if (!decoded || !decoded.sub) {
      console.log("Invalid token structure");
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    // Create a user object from the Supabase token
    const user = {
      id: decoded.sub,
      email: decoded.email,
      stripe_customer_id: decoded.user_metadata?.stripe_customer_id || null,
      stripe_subscription_id:
        decoded.user_metadata?.stripe_subscription_id || null,
      subscription_plan: decoded.user_metadata?.subscription_plan || "free",
      subscription_status:
        decoded.user_metadata?.subscription_status || "active",
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

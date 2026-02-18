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
    const isProduction = process.env.NODE_ENV === 'production';
    
    // CRITICAL SECURITY FIX: Fail secure in production if secret is missing
    // We check for both missing secret AND the known default/placeholder value
    if (isProduction && (!jwtSecret || jwtSecret === "your_super_secret_jwt_key_change_in_production")) {
      console.error("CRITICAL SECURITY ERROR: JWT_SECRET is missing or default in production environment. Refusing to authenticate with fallback secret.");
      return res.status(500).json({
        error: "Server configuration error",
        message: "Authentication service unavailable"
      });
    }

    // In non-production environments, we allow fallback but log a warning
    if (!jwtSecret || jwtSecret === "your_super_secret_jwt_key_change_in_production") {
      console.warn("WARNING: Using default JWT_SECRET. Set a strong secret in production.");
    }

    let decoded: any;
    try {
      // Always verify JWT signature - no decode-only fallback for security
      // The fallback secret is ONLY used in non-production environments (due to the check above)
      decoded = jwt.verify(token, jwtSecret || "fallback-secret-change-in-production");
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

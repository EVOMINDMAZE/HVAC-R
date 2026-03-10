import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

// Supabase JWT verification middleware
export const authenticateSupabaseToken: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    // console.log("Auth middleware called for:", req.path); // Reduced log noise
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      // console.log("No token provided");
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    // Verify JWT signature using JWT_SECRET or SUPABASE_JWT_SECRET environment variable
    let jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
    
    // Default secret for development ONLY
    const DEV_FALLBACK_SECRET = "your_super_secret_jwt_key_change_in_production";

    if (!jwtSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error("FATAL: JWT_SECRET or SUPABASE_JWT_SECRET is missing in production!");
        return res.status(500).json({ error: "Server configuration error" });
      } else {
        console.warn("WARNING: Using default JWT_SECRET. Set a strong secret in production.");
        jwtSecret = DEV_FALLBACK_SECRET;
      }
    } else if (jwtSecret === DEV_FALLBACK_SECRET && process.env.NODE_ENV === 'production') {
       console.error("FATAL: Using default JWT_SECRET in production is not allowed!");
       return res.status(500).json({ error: "Server configuration error" });
    }

    let decoded: any;
    try {
      // Always verify JWT signature - no decode-only fallback for security
      decoded = jwt.verify(token, jwtSecret);
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

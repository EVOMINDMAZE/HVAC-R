import "dotenv/config";
import express from "express";
import cors from "cors";
// Database imports removed - using Supabase for all data storage
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  authenticateToken,
} from "./routes/auth.ts";
import { authenticateSupabaseToken } from "./utils/supabaseAuth.ts";
import { generateReportPdf } from "./routes/reports.ts";
import {
  saveCalculation,
  getCalculations,
  getCalculation,
  updateCalculation,
  deleteCalculation,
  getUserStats,
} from "./routes/calculations.ts";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscription,
  createPaymentIntent,
} from "./routes/subscriptions.ts";
import billingRoutes from "./routes/billing.ts";
import { supabaseDiag } from "./routes/diagnostics.ts";
import { uploadAvatar } from "./routes/storage.ts";

export function createServer() {
  const app = express();

  // Database initialization disabled - using Supabase for all data storage
  console.log("Using Supabase for data storage, SQLite database disabled");

  // Middleware
  // Configure CORS origins. Use ALLOWED_CORS_ORIGINS env var (comma-separated) when present.
  // In development, allow localhost origins. In preview or unspecified environments, allow all origins
  // to avoid blocking the preview iframe. For production, set ALLOWED_CORS_ORIGINS explicitly.
  const defaultAllowed =
    process.env.NODE_ENV === "production"
      ? [
          "https://173ba54839db44079504686aa5642124-7d4f8c681adb406aa7578b14f.fly.dev",
        ]
      : ["http://localhost:8080", "http://localhost:3000"];

  const envList = process.env.ALLOWED_CORS_ORIGINS
    ? process.env.ALLOWED_CORS_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const allowedOrigins = Array.from(new Set([...envList, ...defaultAllowed]));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser requests (like curl or server-to-server) with no origin
        if (!origin) return callback(null, true);
        // If ALLOWED_CORS_ORIGINS contains '*' allow all
        if (allowedOrigins.includes("*")) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // For preview environments where origin may vary, allow if ALLOW_ALL_CORS is set
        if (process.env.ALLOW_ALL_CORS === "true") return callback(null, true);
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  // Increase body size to allow high-resolution diagram images
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // Simple request logging to aid debugging
  app.use((req, _res, next) => {
    console.log(`[server] ${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  });

  // Authentication routes
  app.post("/api/auth/signup", signUp);
  app.post("/api/auth/signin", signIn);
  app.post("/api/auth/signout", signOut);
  app.get("/api/auth/me", getCurrentUser);

  // Protected calculation routes
  app.post("/api/calculations", authenticateToken, saveCalculation);
  app.get("/api/calculations", authenticateToken, getCalculations);
  app.get("/api/calculations/:id", authenticateToken, getCalculation);
  app.put("/api/calculations/:id", authenticateToken, updateCalculation);
  app.delete("/api/calculations/:id", authenticateToken, deleteCalculation);
  app.get("/api/user/stats", authenticateToken, getUserStats);

  // Subscription routes
  app.get("/api/subscriptions/plans", getSubscriptionPlans);
  app.get(
    "/api/subscriptions/current",
    authenticateToken,
    getCurrentSubscription,
  );
  app.post("/api/subscriptions/update", authenticateToken, updateSubscription);
  app.post("/api/subscriptions/cancel", authenticateToken, cancelSubscription);
  app.post(
    "/api/subscriptions/payment-intent",
    authenticateToken,
    createPaymentIntent,
  );

  // Billing routes (Stripe)
  app.use("/api/billing", billingRoutes);

  // Server-side storage upload (uses SUPABASE_SERVICE_ROLE_KEY)
  // Accept either the legacy session token (authenticateToken) or a Supabase JWT (authenticateSupabaseToken)
  app.post("/api/storage/upload", authenticateSupabaseToken, uploadAvatar);

  // Middleware to accept either Supabase JWT (contains dots) or legacy session token
  const authenticateEither: import("express").RequestHandler = (
    req,
    res,
    next,
  ) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    if (!token)
      return res.status(401).json({ error: "Authentication required" });
    // Heuristic: JWTs have at least two dots
    if ((token.match(/\./g) || []).length >= 2) {
      return authenticateSupabaseToken(req, res, next);
    }
    return authenticateToken(req, res, next);
  };

  // Server-side PDF report generation
  app.post("/api/reports/generate", authenticateEither, generateReportPdf);

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Server error:", err);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
      });
    },
  );

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  return app;
}

import "dotenv/config";
import cors from "cors";
import express from "express";

// Database imports removed - using Supabase for all data storage

import { dynamicRateLimiter } from "./middleware/rateLimit.ts";
import {
  securityHeaders,
  hidePoweredBy,
  requestId,
  cspReportingEndpoint,
} from "./middleware/securityHeaders.ts";
import {
  analyzePatterns,
  getRelatedPatterns,
  createSymptomOutcomePattern,
  createMeasurementAnomalyPattern,
  updatePatternFeedback,
  getPatternsByType,
  enhancedTroubleshoot,
} from "./routes/ai-patterns.ts";
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
} from "./routes/auth.ts";
import billingRoutes from "./routes/billing.ts";
import {
  saveCalculation,
  getCalculations,
  getCalculation,
  updateCalculation,
  deleteCalculation,
  getUserStats,
} from "./routes/calculations.ts";
import { supabaseDiag } from "./routes/diagnostics.ts";
import {
  calculateAirflow,
  calculateDeltaT,
  calculateStandardCycleEndpoint,
  calculateCascadeCycleEndpoint,
  compareRefrigerantsEndpoint,
} from "./routes/engineering.ts";
import { getFleetStatus } from "./routes/fleet.ts";
import {
  recordConsent,
  getUserConsents,
  checkConsent,
  submitDataSubjectRequest,
  exportUserData,
} from "./routes/privacy.ts";
import { generateReportPdf } from "./routes/reports.ts";
import { getUserCount } from "./routes/stats.ts";
import { uploadAvatar } from "./routes/storage.ts";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscription,
  createPaymentIntent,
} from "./routes/subscriptions.ts";
import {
  getTeam,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "./routes/team.ts";
import { authenticateSupabaseToken } from "./utils/supabaseAuth.ts";

export function createServer() {
  const app = express();

  // Database initialization disabled - using Supabase for all data storage
  console.log("Using Supabase for data storage, SQLite database disabled");

  // Middleware
  // Configure CORS origins.
  const defaultAllowed =
    process.env.NODE_ENV === "production"
      ? []
      : [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8081",
        "http://localhost:5173",
      ];

  const envList = process.env.ALLOWED_CORS_ORIGINS
    ? process.env.ALLOWED_CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const allowedOrigins = Array.from(new Set([...envList, ...defaultAllowed]));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes("*")) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.ALLOW_ALL_CORS === "true") return callback(null, true);
        console.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );

  app.use(
    express.json({
      limit: "30mb",
      verify: (req: any, _res, buf) => {
        if (
          req.originalUrl &&
          req.originalUrl.startsWith("/api/billing/webhook")
        ) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));
  app.use(hidePoweredBy);
  app.use(requestId);
  app.use(securityHeaders());
  app.use(dynamicRateLimiter);
  app.post("/csp-report", cspReportingEndpoint);

  app.use((req, res, next) => {
    console.log(`[server] ${req.method} ${req.path}`);
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any = null;
    
    res.send = function(body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
      responseBody = JSON.stringify(body);
      return originalJson.call(this, body);
    };
    
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        const contentType = res.getHeader('content-type');
        console.log(`[server] Response: ${res.statusCode} ${res.statusMessage}, Content-Type: ${contentType}`);
        if (responseBody && typeof responseBody === 'string' && responseBody.includes('<!doctype')) {
          console.error(`[server] WARNING: HTML response detected for API route ${req.path}`);
          console.error(`[server] First 500 chars: ${responseBody.substring(0, 500)}`);
        }
      }
    });
    
    next();
  });

  // Ensure JSON content type for all API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      // Set default Content-Type to JSON if not already set
      const contentType = res.getHeader('content-type');
      if (!contentType) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
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

  // Marketing/landing stats (public)
  app.get("/api/stats/user-count", getUserCount);

  // Middleware to accept either Supabase JWT (contains dots) or legacy session token
  const authenticateEither: import("express").RequestHandler = (
    req,
    res,
    next,
  ) => {
    // Compatibility guard in supabaseAuth standardizes canonical/legacy validation
    // sequence while preserving external route protection semantics.
    return authenticateSupabaseToken(req, res, next);
  };

  // Authentication routes
  app.post("/api/auth/signup", signUp);
  app.post("/api/auth/signin", signIn);
  app.post("/api/auth/signout", signOut);
  app.get("/api/auth/me", getCurrentUser);

  // Protected calculation routes
  app.post("/api/calculations", authenticateEither, saveCalculation);
  app.get("/api/calculations", authenticateEither, getCalculations);
  app.get("/api/calculations/:id", authenticateEither, getCalculation);
  app.put("/api/calculations/:id", authenticateEither, updateCalculation);
  app.delete("/api/calculations/:id", authenticateEither, deleteCalculation);
  app.get("/api/user/stats", authenticateEither, getUserStats);

  // Team management routes
  app.get("/api/team", authenticateEither, getTeam);
  app.post("/api/team/invite", authenticateEither, inviteTeamMember);
  app.put("/api/team/role", authenticateEither, updateTeamMemberRole);
  app.delete("/api/team/member", authenticateEither, removeTeamMember);

  // Privacy & consent routes
  app.post("/api/privacy/consent", authenticateEither, recordConsent);
  app.get("/api/privacy/consent", authenticateEither, getUserConsents);
  app.get("/api/privacy/consent/check", authenticateEither, checkConsent);
  app.post("/api/privacy/dsr", authenticateEither, submitDataSubjectRequest);
  app.post("/api/privacy/export", authenticateEither, exportUserData);

  // Fleet management routes
  app.get("/api/fleet/status", authenticateEither, getFleetStatus);

  // Subscription routes
  app.get("/api/subscriptions/plans", getSubscriptionPlans);
  app.get(
    "/api/subscriptions/current",
    authenticateEither,
    getCurrentSubscription,
  );
  app.post("/api/subscriptions/update", authenticateEither, updateSubscription);
  app.post("/api/subscriptions/cancel", authenticateEither, cancelSubscription);
  app.post(
    "/api/subscriptions/payment-intent",
    authenticateEither,
    createPaymentIntent,
  );

  // Billing routes (Stripe)
  app.use("/api/billing", billingRoutes);

  // Engineering Calculations (Thermodynamic Core)
  app.post("/api/calculate-airflow", authenticateEither, calculateAirflow);
  app.post("/api/calculate-deltat", authenticateEither, calculateDeltaT);
  app.post(
    "/api/calculate-standard",
    authenticateEither,
    calculateStandardCycleEndpoint,
  );
  app.post(
    "/api/calculate-cascade",
    authenticateEither,
    calculateCascadeCycleEndpoint,
  );
  app.post(
    "/api/compare-refrigerants",
    authenticateEither,
    compareRefrigerantsEndpoint,
  );

  // Server-side storage upload (uses SUPABASE_SERVICE_ROLE_KEY)
  app.post("/api/storage/upload", authenticateEither, uploadAvatar);

  // Diagnostics route to test server->Supabase connectivity
  app.get("/api/diagnostics/supabase", supabaseDiag);

  // Server-side PDF report generation
  app.post("/api/reports/generate", authenticateEither, generateReportPdf);

  // AI Pattern Recognition Routes
  app.post("/api/ai/patterns/analyze", authenticateEither, analyzePatterns);
  app.post("/api/ai/patterns/related", authenticateEither, getRelatedPatterns);
  app.post(
    "/api/ai/patterns/symptom-outcome",
    authenticateEither,
    createSymptomOutcomePattern,
  );
  app.post(
    "/api/ai/patterns/measurement-anomaly",
    authenticateEither,
    createMeasurementAnomalyPattern,
  );
  app.put(
    "/api/ai/patterns/:patternId/feedback",
    authenticateEither,
    updatePatternFeedback,
  );
  app.get(
    "/api/ai/patterns/:companyId/:type",
    authenticateEither,
    getPatternsByType,
  );
  app.post(
    "/api/ai/enhanced-troubleshoot",
    authenticateEither,
    enhancedTroubleshoot,
  );

  // Error handling middleware
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
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
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({
        error: "Not found",
        message: `Route ${req.method} ${req.path} not found`,
      });
    } else {
      next();
    }
  });

  return app;
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import { ensureDbInitialized, sessionDb } from "./database/index.js";
import { signUp, signIn, signOut, getCurrentUser, authenticateToken } from "./routes/auth.ts";
import {
  saveCalculation,
  getCalculations,
  getCalculation,
  updateCalculation,
  deleteCalculation,
  getUserStats
} from "./routes/calculations.ts";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscription,
  createPaymentIntent
} from "./routes/subscriptions.ts";

export function createServer() {
  const app = express();

  // Initialize database
  ensureDbInitialized();

  // Clean up expired sessions periodically
  setInterval(() => {
    sessionDb.deleteExpired.run();
  }, 60 * 60 * 1000); // Every hour

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-domain.com']
      : ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
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
  app.get("/api/subscriptions/current", authenticateToken, getCurrentSubscription);
  app.post("/api/subscriptions/update", authenticateToken, updateSubscription);
  app.post("/api/subscriptions/cancel", authenticateToken, cancelSubscription);
  app.post("/api/subscriptions/payment-intent", authenticateToken, createPaymentIntent);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  return app;
}

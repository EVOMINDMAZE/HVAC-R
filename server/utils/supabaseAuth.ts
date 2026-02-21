import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import {
  AuthValidationResult,
  AuthValidationPath,
  AuthRuntimePathLabel,
  runAuthCompatibilityGuard,
  toCompatAuthContext,
} from "../routes/compat/authAdapter.js";
import { getSupabaseClient } from "./supabase.js";
import { trackPerformance } from "../middleware/monitoring.js";

type ValidateTokenFn = (token: string) => Promise<AuthValidationResult>;

function safeTelemetryPath(path?: AuthValidationPath): string {
  if (path === "canonical" || path === "legacy") {
    return path;
  }

  return "compat";
}

function safeTelemetryRuntimePath(path?: AuthRuntimePathLabel): string {
  if (path === "canonical" || path === "legacy") {
    return path;
  }

  return "compat";
}

function getRuntimePathFromRequest(req: any): string | undefined {
  const headerRuntimePath = Array.isArray(req.headers?.["x-runtime-path"])
    ? req.headers?.["x-runtime-path"]?.[0]
    : req.headers?.["x-runtime-path"];

  return req.runtimePath || headerRuntimePath;
}

const validateCanonicalToken: ValidateTokenFn = async (token) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

  if (
    !jwtSecret ||
    jwtSecret === "your_super_secret_jwt_key_change_in_production"
  ) {
    console.warn(
      "WARNING: Using default JWT_SECRET. Set a strong secret in production.",
    );
  }

  try {
    const decoded: any = jwt.verify(
      token,
      jwtSecret || "fallback-secret-change-in-production",
    );

    if (!decoded || !decoded.sub) {
      return {
        ok: false,
        error: "Invalid token",
      };
    }

    return {
      ok: true,
      user: toCompatAuthContext(decoded),
    };
  } catch (_error: any) {
    return {
      ok: false,
      error: "Invalid token signature",
    };
  }
};

const validateLegacyToken: ValidateTokenFn = async (token) => {
  try {
    const supabase = getSupabaseClient(token);
    if (!supabase) {
      return {
        ok: false,
        error: "Authentication failed",
      };
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        ok: false,
        error: "Authentication failed",
      };
    }

    return {
      ok: true,
      user: toCompatAuthContext({
        sub: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      }),
    };
  } catch (_error: any) {
    return {
      ok: false,
      error: "Authentication failed",
    };
  }
};

export function createAuthenticateSupabaseToken(deps?: {
  validateCanonical?: ValidateTokenFn;
  validateLegacy?: ValidateTokenFn;
}): RequestHandler {
  return async (req, res, next): Promise<void> => {
    try {
      console.log("Auth middleware called for:", req.path);
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        console.log("No token provided");
        res.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const runtimePath = getRuntimePathFromRequest(req);
      const authResult = await runAuthCompatibilityGuard({
        token,
        runtimePath,
        validateCanonical: deps?.validateCanonical || validateCanonicalToken,
        validateLegacy: deps?.validateLegacy || validateLegacyToken,
      });

      (req as any).runtimePath = authResult.runtimePath;
      (req as any).authPath = authResult.authPath;
      (req as any).fallbackUsed = authResult.fallbackUsed;
      (req as any).authMigrationTags = authResult.migrationTags;

      trackPerformance("auth_path_execution", 1, "count", {
        runtimePath: safeTelemetryRuntimePath(authResult.runtimePath),
        authPath: safeTelemetryPath(authResult.authPath),
        fallbackUsed: String(authResult.fallbackUsed),
      });

      if (!authResult.ok) {
        const errorMessage =
          "error" in authResult ? authResult.error : "Authentication failed";
        res.status(401).json({
          error: errorMessage,
        });
        return;
      }

      (req as any).user = authResult.user;
      next();
    } catch (error) {
      console.error("Supabase authentication error:", error);
      res.status(401).json({
        error: "Authentication failed",
      });
    }
  };
}

// Supabase JWT verification middleware
export const authenticateSupabaseToken: RequestHandler =
  createAuthenticateSupabaseToken();

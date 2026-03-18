import "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      runtimePath?: "legacy" | "compat" | "canonical";
      authPath?: "legacy" | "canonical";
      fallbackUsed?: boolean;
      authMigrationTags?: string[];
      session?: {
        id?: string;
        [key: string]: unknown;
      };
      user?: {
        id?: string;
        email?: string;
        role?: string;
        companyId?: string;
        active_company_id?: string;
        active_role?: string;
        user_metadata?: Record<string, unknown>;
        [key: string]: unknown;
      };
    }
  }
}

export { };

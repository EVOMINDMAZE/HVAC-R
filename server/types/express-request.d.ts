import "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      session?: {
        id?: string;
        [key: string]: unknown;
      };
      user?: {
        id?: string;
        email?: string;
        role?: string;
        companyId?: string;
        [key: string]: unknown;
      };
    }
  }
}

export {};

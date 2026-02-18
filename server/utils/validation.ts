import { RequestHandler, Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

import { z } from 'zod';

export const commonSchemas = {
  id: z.string().uuid(),
  email: z.string().email(),
  positiveNumber: z.number().positive(),
  nonEmptyString: z.string().min(1),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }),
};

export const authSchemas = {
  signIn: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  signUp: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
    fullName: z.string().min(2),
  }),
  passwordReset: z.object({
    email: z.string().email(),
  }),
  passwordUpdate: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
  }),
};

export const calculationSchemas = {
  save: z.object({
    type: z.enum(['superheat', 'subcooling', 'a2l', 'psychrometric', 'ductulator', 'electrical']),
    name: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    parameters: z.record(z.string(), z.unknown()),
    results: z.record(z.string(), z.unknown()),
  }),
  list: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    type: z.enum(['superheat', 'subcooling', 'a2l', 'psychrometric', 'ductulator', 'electrical']).optional(),
  }),
};

export const consentSchemas = {
  record: z.object({
    consent_type: z.string().min(1),
    consent_version: z.string().min(1),
    granted: z.boolean(),
  }),
  check: z.object({
    consent_type: z.string().min(1),
    consent_version: z.string().optional(),
  }),
};

export const dsrSchemas = {
  submit: z.object({
    request_type: z.enum(['access', 'deletion', 'correction', 'portability']),
    description: z.string().max(2000).optional(),
  }),
};

export const jobSchemas = {
  create: z.object({
    clientId: z.string().uuid(),
    jobType: z.string().min(1),
    description: z.string().max(5000).optional(),
    scheduledDate: z.string().datetime().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
  update: z.object({
    status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    notes: z.string().max(5000).optional(),
    technicianId: z.string().uuid().optional(),
  }),
};

export const clientSchemas = {
  create: z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  }),
  update: z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    address: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
  }),
};
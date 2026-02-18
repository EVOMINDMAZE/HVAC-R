import { RequestHandler, Request, Response, NextFunction } from 'express';
import { checkRateLimit, RateLimitConfig, defaultRateLimits } from './rateLimit.js';

export interface RateLimitMiddlewareOptions extends Partial<RateLimitConfig> {
  identifier?: (req: Request) => string;
  handler?: (req: Request, res: Response, next: NextFunction, result: { allowed: boolean; retryAfter?: number }) => void;
}

function defaultIdentifier(req: Request): string {
  return req.ip || 
    req.headers['x-forwarded-for']?.toString() || 
    req.headers['x-real-ip']?.toString() || 
    'unknown';
}

function defaultHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
  result: { allowed: boolean; retryAfter?: number }
): void {
  if (!result.allowed) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    });
  }
}

export function rateLimitMiddleware(options: RateLimitMiddlewareOptions = {}): RequestHandler {
  const config: RateLimitConfig = {
    windowMs: options.windowMs ?? 60000,
    maxRequests: options.maxRequests ?? 100,
    keyPrefix: options.keyPrefix ?? 'api',
  };

  const identifier = options.identifier ?? defaultIdentifier;
  const handler = options.handler ?? defaultHandler;

  return async (req: Request, res: Response, next: NextFunction) => {
    const id = identifier(req);
    const result = await checkRateLimit(id, config);

    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }
      handler(req, res, next, result);
      return;
    }

    next();
  };
}

export const apiRateLimit = rateLimitMiddleware(defaultRateLimits.api);

export const authRateLimit = rateLimitMiddleware({
  ...defaultRateLimits.auth,
  identifier: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const email = req.body?.email?.toLowerCase() || '';
    return `${ip}:${email}`;
  },
});

export const calculationRateLimit = rateLimitMiddleware(defaultRateLimits.calculations);

export const uploadRateLimit = rateLimitMiddleware(defaultRateLimits.upload);

export const passwordResetRateLimit = rateLimitMiddleware({
  ...defaultRateLimits.passwordReset,
  identifier: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const email = req.body?.email?.toLowerCase() || '';
    return `pwdreset:${ip}:${email}`;
  },
});
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  handler?: (req: Request, res: Response, next: NextFunction, options: RateLimitConfig, resetTime?: number) => void;
}

interface RateLimitInfo {
  total: number;
  remaining: number;
  resetTime: Date;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const defaultStore: RateLimitStore = {};

const defaultHandler = (req: Request, res: Response, _next: NextFunction, options: RateLimitConfig, resetTime?: number) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  res.setHeader('Retry-After', retryAfter);
  res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
  res.setHeader('X-RateLimit-Remaining', '0');

  const resetHeader = resetTime ? Math.ceil(resetTime / 1000) : Math.ceil(Date.now() / 1000);
  res.setHeader('X-RateLimit-Reset', String(resetHeader));
  
  res.status(options.statusCode || 429).json({
    success: false,
    error: 'Too Many Requests',
    message: options.message || 'You have exceeded the rate limit. Please try again later.',
    retry_after: retryAfter,
  });
};

const defaultKeyGenerator = (req: Request): string => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userId = (req as any).user?.id;
  return userId ? `user:${userId}` : `ip:${ip}`;
};

export function createRateLimiter(config: RateLimitConfig) {
  const options: RateLimitConfig = {
    windowMs: config.windowMs || 60000,
    maxRequests: config.maxRequests || 100,
    message: config.message || 'Too Many Requests',
    statusCode: config.statusCode || 429,
    keyGenerator: config.keyGenerator || defaultKeyGenerator,
    skipFailedRequests: config.skipFailedRequests || false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    handler: config.handler || defaultHandler,
    ...config,
  };

  const store = new Map<string, { count: number; resetTime: number }>();
  const windowStart = Date.now();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator!(req);
    req.rateLimitKey = key;

    let record = store.get(key);
    const now = Date.now();
    const windowEnd = windowStart + options.windowMs;

    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
      };
      store.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, options.maxRequests - record.count);
    const resetTime = new Date(record.resetTime);

    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > options.maxRequests) {
      options.handler!(req, res, next, options, record.resetTime);
      return;
    }

    res.on('finish', () => {
      if (options.skipFailedRequests && res.statusCode >= 400) {
        record!.count = Math.max(0, record!.count - 1);
      }
      if (options.skipSuccessfulRequests && res.statusCode < 400) {
        record!.count = Math.max(0, record!.count - 1);
      }
    });

    next();
  };
}

export function getRateLimitInfo(req: Request): RateLimitInfo | null {
  const key = req.rateLimitKey;
  if (!key) return null;

  const record = defaultStore[key];
  if (!record) {
    return {
      total: 0,
      remaining: 100,
      resetTime: new Date(Date.now() + 60000),
    };
  }

  return {
    total: record.count,
    remaining: Math.max(0, 100 - record.count),
    resetTime: new Date(record.resetTime),
  };
}

export const rateLimitConfigs = {
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Rate limit exceeded. Please wait before making more requests.',
  },
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests. Please try again in a minute.',
  },
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
    message: 'Rate limit exceeded. Please try again later.',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  upload: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    message: 'Upload limit exceeded. Please try again in an hour.',
  },
};

export const strictRateLimiter = createRateLimiter(rateLimitConfigs.strict);
export const standardRateLimiter = createRateLimiter(rateLimitConfigs.standard);
export const lenientRateLimiter = createRateLimiter(rateLimitConfigs.lenient);
export const authRateLimiter = createRateLimiter(rateLimitConfigs.auth);
export const uploadRateLimiter = createRateLimiter(rateLimitConfigs.upload);

declare global {
  namespace Express {
    interface Request {
      rateLimitKey?: string;
    }
  }
}

import { RequestHandler } from 'express';

export const dynamicRateLimiter: RequestHandler = (req, res, next) => {
  const isAuthenticated = !!(req as any).user?.id;
  const isAuthEndpoint = req.path.includes('/auth/');
  const isUploadEndpoint = req.path.includes('/upload');
  
  if (isAuthEndpoint) {
    return authRateLimiter(req, res, next);
  }
  
  if (isUploadEndpoint) {
    return uploadRateLimiter(req, res, next);
  }
  
  if (isAuthenticated) {
    return lenientRateLimiter(req, res, next);
  }
  
  return standardRateLimiter(req, res, next);
};

export function createSlidingWindowRateLimiter(windowMs: number = 60000, maxRequests: number = 100) {
  const requests: number[] = [];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    while (requests.length > 0 && requests[0] <= windowStart) {
      requests.shift();
    }
    
    requests.push(now);
    
    const remaining = Math.max(0, maxRequests - requests.length);
    const resetTime = new Date(now + windowMs);
    
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime.getTime() / 1000)));
    
    if (requests.length > maxRequests) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }
    
    next();
  };
}

export const slidingWindowRateLimiter = createSlidingWindowRateLimiter();

export function rateLimitByUser(userId: string, maxRequests: number = 1000): boolean {
  const key = `user:${userId}`;
  const record = defaultStore[key];
  const now = Date.now();
  
  if (!record || record.resetTime < now) {
    defaultStore[key] = {
      count: 0,
      resetTime: now + 60000,
    };
  }
  
  defaultStore[key].count++;
  return defaultStore[key].count <= maxRequests;
}

export function getRateLimitStats(): {
  totalKeys: number;
  totalRequests: number;
  topKeys: Array<{ key: string; count: number }>;
} {
  const entries = Object.entries(defaultStore);
  const now = Date.now();
  
  const validEntries = entries.filter(([, record]) => record.resetTime > now);
  const totalRequests = validEntries.reduce((sum, [, record]) => sum + record.count, 0);
  
  const topKeys = validEntries
    .map(([key, record]) => ({ key, count: record.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalKeys: validEntries.length,
    totalRequests,
    topKeys,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const key in defaultStore) {
    if (defaultStore[key].resetTime < now) {
      delete defaultStore[key];
    }
  }
}, 60 * 1000);
/**
 * Sentry Configuration for Express Backend
 * 
 * This module configures Sentry for error tracking and performance monitoring
 * in the ThermoNeural Express backend.
 * 
 * @module sentry-server
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'unknown';

export const isSentryEnabled = !!SENTRY_DSN;

export function initSentry() {
  if (!isSentryEnabled) {
    console.warn('[Sentry] Sentry is not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new ProfilingIntegration(),
    ],
    
    tracesSampleRate: 0.2,
    
    profilesSampleRate: 0.1,
    
    beforeSend(event: Sentry.Event, hint: { originalException?: { message?: string } }) {
      const error = hint.originalException;
      
      if (error?.message?.includes('ECONNRESET')) {
        return null;
      }
      
      if (error?.message?.includes('ETIMEDOUT')) {
        return null;
      }
      
      return event;
    },
    
    beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      return breadcrumb;
    },
    
    initialScope: {
      tags: {
        application: 'thermoneural-api',
        version: SENTRY_RELEASE,
      },
    },
    
    maxBreadcrumbs: 100,
    attachStacktrace: true,
    sendDefaultPii: false,
  });

  console.log('[Sentry] Backend initialized successfully');
}

export function sentryRequestHandler() {
  if (!isSentryEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return Sentry.Handlers.requestHandler({
    request: ['headers', 'method', 'url', 'query_string'],
    user: ['id', 'email', 'role', 'companyId'],
    ip: true,
  });
}

export function sentryTracingHandler() {
  if (!isSentryEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return Sentry.Handlers.tracingHandler();
}

export function sentryErrorHandler() {
  if (!isSentryEnabled) {
    return (err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('[Sentry] Error (not sent):', err);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message,
      });
    };
  }

  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: { status?: number }) {
      return (error.status ?? 0) >= 400 && (error.status ?? 0) < 600;
    },
  });
}

export function setSentryUser(user: { id: string; email?: string; role?: string; companyId?: string } | null) {
  if (!isSentryEnabled) return;

  Sentry.setUser({
    id: user?.id,
    email: user?.email,
    role: user?.role,
    companyId: user?.companyId,
  });
}

export function setSentryTag(key: string, value: string) {
  if (!isSentryEnabled) return;
  Sentry.setTag(key, value);
}

export function setSentryContext(name: string, context: Record<string, unknown>) {
  if (!isSentryEnabled) return;
  Sentry.setContext(name, context);
}

export function addSentryBreadcrumb(category: string, message: string, data?: Record<string, unknown>, level?: 'debug' | 'info' | 'warning' | 'error') {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
}

export function captureSentryException(error: Error, context?: Record<string, unknown>) {
  if (!isSentryEnabled) {
    console.error('[Sentry] Error (not sent):', error);
    return null;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

export function captureSentryMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  if (!isSentryEnabled) {
    console.log(`[Sentry] ${level}: ${message}`);
    return null;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function startSentryTransaction(name: string, op: string) {
  if (!isSentryEnabled) {
    return { finish: () => {}, setStatus: () => {} };
  }

  return Sentry.startTransaction({
    name,
    op,
  });
}

export function createSentryScope(req: Request) {
  if (!isSentryEnabled) {
    return {
      setTag: () => {},
      setContext: () => {},
      setUser: () => {},
      addBreadcrumb: () => {},
    };
  }

  const scope = Sentry.getCurrentScope();
  
  scope.setTag('http.method', req.method);
  scope.setTag('http.url', req.originalUrl);
  scope.setTag('http.user_agent', req.get('user-agent') || 'unknown');
  scope.setTag('http.ip', req.ip || req.connection.remoteAddress || 'unknown');
  
  if (req.requestId) {
    scope.setTag('request.id', req.requestId);
  }
  
  return scope;
}

export function captureAPIError(req: Request, error: Error, statusCode?: number) {
  if (!isSentryEnabled) {
    console.error(`[Sentry] API Error (not sent): ${req.method} ${req.path}`, error);
    return null;
  }

  const scope = createSentryScope(req);
  
  scope.setTag('error.type', statusCode ? `HTTP ${statusCode}` : 'Error');
  scope.setTag('error.endpoint', req.path);
  scope.setTag('error.method', req.method);
  
  if (req.user) {
    scope.setUser({
      id: (req.user as any).id,
      email: (req.user as any).email,
      role: (req.user as any).role,
      companyId: (req.user as any).companyId,
    });
  }

  return Sentry.captureException(error, {
    extra: {
      endpoint: req.path,
      method: req.method,
      statusCode,
      query: req.query,
      body: req.body ? JSON.stringify(req.body).substring(0, 1000) : undefined,
    },
  });
}

export function captureAuthEvent(req: Request, event: 'login' | 'logout' | 'signup' | 'failed', success: boolean, userId?: string) {
  if (!isSentryEnabled) return;

  const scope = createSentryScope(req);
  
  scope.setTag('auth.event', event);
  scope.setTag('auth.success', String(success));
  
  if (userId) {
    scope.setUser({ id: userId });
  }

  addSentryBreadcrumb(
    'auth',
    `User ${event} ${success ? 'succeeded' : 'failed'}`,
    { userId, success },
    success ? 'info' : 'warning'
  );
}

export function capturePerformanceMetric(req: Request, duration: number, statusCode: number) {
  if (!isSentryEnabled) return;

  const scope = createSentryScope(req);
  
  scope.setTag('performance.duration_ms', String(Math.round(duration)));
  scope.setTag('performance.status_code', String(statusCode));
  
  if (duration > 2000) {
    scope.setTag('performance.slow', 'true');
    addSentryBreadcrumb(
      'performance',
      `Slow request: ${Math.round(duration)}ms`,
      { duration, statusCode },
      'warning'
    );
  }
}

export {
  Sentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setContext,
  startTransaction,
} from '@sentry/node';

export type { Event, Exception, Breadcrumb, User } from '@sentry/node';
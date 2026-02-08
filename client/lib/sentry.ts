/**
 * Sentry Initialization for React Frontend
 * 
 * This module configures Sentry for error tracking and performance monitoring
 * in the ThermoNeural React application.
 * 
 * @module sentry
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/replay';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = import.meta.env.VITE_SENTRY_RELEASE || 'unknown';

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
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'https://api.thermoneural.com',
          'https://api-staging.thermoneural.com',
        ],
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(),
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
      }),
    ],
    
    tracesSampleRate: 0.2,
    
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      if (error?.message?.includes('ResizeObserver')) {
        return null;
      }
      
      if (error?.message?.includes('Non-Error exception captured')) {
        return null;
      }
      
      return event;
    },
    
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      return breadcrumb;
    },
    
    initialScope: {
      tags: {
        application: 'thermoneural-web',
        version: SENTRY_RELEASE,
      },
    },
    
    maxBreadcrumbs: 100,
    attachStacktrace: true,
    sendDefaultPii: false,
  });

  console.log('[Sentry] Initialized successfully');
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
    return { finish: () => {} };
  }

  return Sentry.startTransaction({
    name,
    op,
  });
}

export function withSentryProfiler<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  profileName: string
): T {
  if (!isSentryEnabled) return fn;

  return Sentry.profiler(fn, profileName) as T;
}

export const SentryRoutes = Sentry.withSentryRouting(Sentry.withReactRouter6Routing);

export {
  Sentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  setContext,
  startTransaction,
} from '@sentry/react';

export {
  ErrorBoundary,
  showReportDialog,
  useRouteError,
  useLastError,
} from '@sentry/react';

export type { Breadcrumb, User } from '@sentry/react';
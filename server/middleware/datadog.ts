/**
 * Datadog APM Integration for Express Backend
 * 
 * This module configures Datadog APM (Application Performance Monitoring)
 * for the ThermoNeural Express backend.
 * 
 * @module datadog-server
 */

import { tracer, logger, metrics } from 'dd-trace';
import { Request, Response, NextFunction } from 'express';

const DATADOG_AGENT_HOST = process.env.DATADOG_AGENT_HOST || 'localhost';
const DATADOG_AGENT_PORT = parseInt(process.env.DATADOG_AGENT_PORT || '8126', 10);
const DATADOG_ENVIRONMENT = process.env.NODE_ENV || 'development';
const DATADOG_SERVICE = process.env.DATADOG_SERVICE || 'thermoneural-api';
const DATADOG_VERSION = process.env.DATADOG_VERSION || 'unknown';

export const isDatadogEnabled = process.env.DATADOG_ENABLED === 'true';

export function initDatadog() {
  if (!isDatadogEnabled) {
    console.warn('[Datadog] Datadog is not configured. APM disabled.');
    return;
  }

  try {
    tracer.init({
      hostname: DATADOG_AGENT_HOST,
      port: DATADOG_AGENT_PORT,
      env: DATADOG_ENVIRONMENT,
      service: DATADOG_SERVICE,
      version: DATADOG_VERSION,
      
      logInjection: true,
      runtimeMetrics: true,
      profiling: {
        enabled: true,
        sourceMap: true,
      },
      
      analytics: true,
      analyticsSampleRate: 0.2,
      
      tags: {
        application: 'thermoneural-api',
        version: DATADOG_VERSION,
      },
      
      filters: [
        {
          // Ignore health check endpoints
          name: 'health-filter',
          path: '/api/health',
          type: 'request',
        },
        {
          // Ignore static assets
          name: 'static-filter',
          path: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/,
          type: 'request',
        },
      ],
      
      onError: (error: Error) => {
        console.error('[Datadog] Tracer error:', error);
      },
    });

    logger.init({
      level: 'info',
      hostname: DATADOG_AGENT_HOST,
      port: DATADOG_AGENT_PORT,
      service: DATADOG_SERVICE,
      env: DATADOG_ENVIRONMENT,
      version: DATADOG_VERSION,
    });

    metrics.init({
      hostname: DATADOG_AGENT_HOST,
      port: DATADOG_AGENT_PORT,
      service: DATADOG_SERVICE,
      env: DATADOG_ENVIRONMENT,
      version: DATADOG_VERSION,
    });

    console.log('[Datadog] Backend APM initialized successfully');
  } catch (error) {
    console.error('[Datadog] Failed to initialize:', error);
  }
}

export function datadogRequestMiddleware() {
  if (!isDatadogEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const span = tracer.startSpan('http.request', {
      childOf: tracer.scope().active(),
      tags: {
        'span.kind': 'server',
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.route': req.route?.path || req.path,
        'http.user_agent': req.get('user-agent') || 'unknown',
        'http.client_ip': req.ip || req.connection.remoteAddress || 'unknown',
        'http.request_id': (req as any).requestId,
      },
    });

    (req as any).datadogSpan = span;

    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      span.setTag('http.response_size', res.get('content-length') || 0);
      
      if (res.statusCode >= 400) {
        span.setTag('error', true);
      }
      
      span.finish();
    });

    next();
  };
}

export function datadogTracingMiddleware() {
  if (!isDatadogEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return tracer.trace('middleware', 'express', (_req: Request, _res: Response, next: NextFunction) => {
    next();
  });
}

export function setDatadogTags(tags: Record<string, string | number | boolean>) {
  if (!isDatadogEnabled) return;
  tracer.setTags(tags);
}

export function setDatadogTag(key: string, value: string | number | boolean) {
  if (!isDatadogEnabled) return;
  tracer.setTag(key, value);
}

export function setDatadogUser(user: { id: string; email?: string; role?: string; companyId?: string } | null) {
  if (!isDatadogEnabled) return;

  tracer.setUser({
    id: user?.id,
    email: user?.email,
    role: user?.role,
    company_id: user?.companyId,
  });
}

export function trackDatadogEvent(name: string, metadata?: Record<string, unknown>) {
  if (!isDatadogEnabled) {
    console.log(`[Datadog] Event: ${name}`, metadata);
    return;
  }

  logger.info(name, metadata);
}

export function trackDatadogError(error: Error, context?: Record<string, unknown>) {
  if (!isDatadogEnabled) {
    console.error('[Datadog] Error (not sent):', error);
    return;
  }

  tracer.trace('error', 'exception', (span: import('dd-trace').Span) => {
    span.setTag('error.message', error.message);
    span.setTag('error.stack', error.stack || '');
    span.setTag('error.type', error.constructor.name);
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        span.setTag(`error.context.${key}`, String(value));
      });
    }
  });

  logger.error('Error occurred', {
    error_message: error.message,
    error_stack: error.stack,
    error_type: error.constructor.name,
    ...context,
  });
}

export function trackDatadogMetric(name: string, value: number, tags?: Record<string, string>) {
  if (!isDatadogEnabled) return;

  const tagList = tags ? Object.entries(tags).map(([key, value]) => `${key}:${value}`) : [];
  metrics.gauge(name, value, tagList);
}

export function incrementDatadogMetric(name: string, tags?: Record<string, string>) {
  if (!isDatadogEnabled) return;

  const tagList = tags ? Object.entries(tags).map(([key, value]) => `${key}:${value}`) : [];
  metrics.increment(name, tagList);
}

export function histogramDatadogMetric(name: string, value: number, tags?: Record<string, string>) {
  if (!isDatadogEnabled) return;

  const tagList = tags ? Object.entries(tags).map(([key, value]) => `${key}:${value}`) : [];
  metrics.histogram(name, value, tagList);
}

export function createDatadogSpan(name: string, options?: {
  type?: string;
  service?: string;
  resource?: string;
  tags?: Record<string, string | number | boolean>;
}) {
  if (!isDatadogEnabled) {
    return {
      finish: () => {},
      setTag: () => {},
      addTags: () => {},
      log: () => {},
    };
  }

  const span = tracer.startSpan(name, {
    childOf: tracer.scope().active(),
    tags: {
      'span.kind': 'internal',
      'span.type': options?.type || 'custom',
      'service.name': options?.service || DATADOG_SERVICE,
      resource: options?.resource || name,
      ...options?.tags,
    },
  });

  return {
    finish: () => span.finish(),
    setTag: (key: string, value: string | number | boolean) => span.setTag(key, value),
    addTags: (tags: Record<string, string | number | boolean>) => span.setTags(tags),
    log: (message: string, fields?: Record<string, unknown>) => {
      span.log({
        message,
        ...fields,
      });
    },
  };
}

export function traceDatadogFunction<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T,
  options?: {
    type?: string;
    service?: string;
    resource?: string;
  }
): T {
  if (!isDatadogEnabled) return fn;

  return tracer.trace(name, {
    type: options?.type || 'function',
    service: options?.service || DATADOG_SERVICE,
    resource: options?.resource || name,
  }, fn) as T;
}

export function captureAPIMetrics(req: Request, res: Response, duration: number) {
  if (!isDatadogEnabled) return;

  const tags = [
    `method:${req.method}`,
    `endpoint:${req.route?.path || req.path}`,
    `status:${res.statusCode}`,
    `environment:${DATADOG_ENVIRONMENT}`,
  ];

  metrics.gauge('api.request.duration', duration, tags);
  metrics.increment('api.request.count', tags);
  
  if (res.statusCode >= 400) {
    metrics.increment('api.request.error', tags);
  }
  
  if (duration > 2000) {
    metrics.increment('api.request.slow', tags);
  }

  histogramDatadogMetric('api.request.duration_histogram', duration, {
    method: req.method,
    status: String(res.statusCode),
  });
}

export function captureBusinessMetrics(
  event: string,
  value: number,
  metadata?: Record<string, string | number>
) {
  if (!isDatadogEnabled) return;

  const tags = [
    `event:${event}`,
    `environment:${DATADOG_ENVIRONMENT}`,
  ];

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      tags.push(`${key}:${value}`);
    });
  }

  metrics.gauge(`business.${event}`, value, tags);
  metrics.increment(`business.${event}_count`, tags);
}

export {
  tracer,
  logger,
  metrics,
  profile,
} from 'dd-trace';

export type { Span, Tracer, Logger, Metrics } from 'dd-trace';
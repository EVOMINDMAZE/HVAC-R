/**
 * Monitoring and Observability Module
 * 
 * Provides comprehensive application performance monitoring (APM),
 * error tracking, and performance metrics collection.
 * 
 * @module monitoring
 */

import { createContext, useContext, useEffect, useRef, useCallback, ReactNode, FC } from 'react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  page?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  type: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

interface MonitoringContextValue {
  log: (level: LogLevel, message: string, context?: Record<string, unknown>) => void;
  error: (error: Error, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  debug: (message: string, context?: Record<string, unknown>) => void;
  trackPerformance: (metric: PerformanceMetric) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  startTimer: (name: string) => () => void;
  getSessionId: () => string;
  getUserId: () => string | undefined;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

let sessionId: string | null = null;
let userId: string | undefined = undefined;

function generateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  if (!sessionId) {
    sessionId = sessionStorage.getItem('monitoring_session_id') || 
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }
  return sessionId;
}

export function setMonitoringUserId(id: string | undefined): void {
  userId = id;
}

export function getMonitoringSessionId(): string {
  return generateSessionId();
}

function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, userId: uid, sessionId: sid } = entry;
  const formatted = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
  
  const extras: Record<string, unknown> = {};
  if (uid) extras.userId = uid;
  if (sid) extras.sessionId = sid;
  if (context) extras.context = context;
  
  if (Object.keys(extras).length > 0) {
    return `${formatted} ${JSON.stringify(extras)}`;
  }
  return formatted;
}

function sendToConsole(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);
  switch (entry.level) {
    case 'error':
      console.error(formatted);
      if (entry.error) console.error(entry.error);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
  }
}

function sendToRemote(entry: LogEntry): void {
  if (typeof window === 'undefined') return;
  
  const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
  if (!endpoint) return;
  
  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      }),
    }).catch(() => {
      console.warn('Failed to send log to remote endpoint');
    });
  } catch {
    console.warn('Failed to serialize log entry');
  }
}

function processLogEntry(entry: LogEntry): void {
  sendToConsole(entry);
  sendToRemote(entry);
}

export const MonitoringProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const performanceBuffer = useRef<PerformanceMetric[]>([]);
  const errorBuffer = useRef<ErrorEvent[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushPerformance = useCallback(() => {
    if (performanceBuffer.current.length === 0) return;
    
    const metrics = [...performanceBuffer.current];
    performanceBuffer.current = [];
    
    const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
    if (endpoint) {
      fetch(`${endpoint}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      }).catch(() => {});
    }
  }, []);

  const flushErrors = useCallback(() => {
    if (errorBuffer.current.length === 0) return;
    
    const errors = [...errorBuffer.current];
    errorBuffer.current = [];
    
    const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
    if (endpoint) {
      fetch(`${endpoint}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    flushTimer.current = setInterval(() => {
      flushPerformance();
      flushErrors();
    }, 30000);

    return () => {
      if (flushTimer.current) {
        clearInterval(flushTimer.current);
      }
    };
  }, [flushPerformance, flushErrors]);

  const log = useCallback((level: LogLevel, message: string, context?: Record<string, unknown>) => {
    processLogEntry({
      timestamp: new Date(),
      level,
      message,
      context,
      userId,
      sessionId: generateSessionId(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }, []);

  const error = useCallback((err: Error, context?: Record<string, unknown>) => {
    log('error', err.message, { ...context, stack: err.stack });
    
    const errorEvent: ErrorEvent = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: err.message,
      stack: err.stack,
      type: err.constructor.name,
      timestamp: new Date(),
      userId,
      sessionId: generateSessionId(),
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      metadata: context,
    };
    
    errorBuffer.current.push(errorEvent);
    if (errorBuffer.current.length >= 10) {
      flushErrors();
    }
  }, [log, flushErrors]);

  const warn = useCallback((message: string, context?: Record<string, unknown>) => {
    log('warn', message, context);
  }, [log]);

  const info = useCallback((message: string, context?: Record<string, unknown>) => {
    log('info', message, context);
  }, [log]);

  const debug = useCallback((message: string, context?: Record<string, unknown>) => {
    log('debug', message, context);
  }, [log]);

  const trackPerformance = useCallback((metric: PerformanceMetric) => {
    performanceBuffer.current.push(metric);
    if (performanceBuffer.current.length >= 20) {
      flushPerformance();
    }
  }, [flushPerformance]);

  const trackError = useCallback((err: Error, context?: Record<string, unknown>) => {
    error(err, context);
  }, [error]);

  const startTimer = useCallback((name: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      trackPerformance({
        name,
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
      });
    };
  }, [trackPerformance]);

  const getSessionId = useCallback(() => generateSessionId(), []);
  const getUserId = useCallback(() => userId, []);

  return (
    <MonitoringContext.Provider value={{
      log,
      error,
      warn,
      info,
      debug,
      trackPerformance,
      trackError,
      startTimer,
      getSessionId,
      getUserId,
    }}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring(): MonitoringContextValue {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}

export function usePerformanceTracking(name: string) {
  const { startTimer, trackPerformance } = useMonitoring();
  const timerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    timerRef.current = startTimer(name);
    return () => {
      if (timerRef.current) {
        timerRef.current();
      }
    };
  }, [name, startTimer]);

  const recordValue = useCallback((value: number, unit: PerformanceMetric['unit'] = 'ms') => {
    trackPerformance({
      name,
      value,
      unit,
      timestamp: new Date(),
    });
  }, [name, trackPerformance]);

  return { recordValue };
}

export function useErrorBoundary() {
  const { error, trackError } = useMonitoring();

  const handleError = useCallback((err: Error, context?: Record<string, unknown>) => {
    error(err, context);
    trackError(err, context);
  }, [error, trackError]);

  return { handleError };
}

export function logPageView(pageName: string): void {
  if (typeof window === 'undefined') return;
  
  const { href } = window.location;
  const referrer = document.referrer;
  
  console.info(`[PageView] ${pageName} - ${href}`);
  
  const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
  if (endpoint) {
    fetch(`${endpoint}/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pageName,
        href,
        referrer,
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId(),
        userId,
      }),
    }).catch(() => {});
  }
}

export function trackUserAction(action: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  
  console.info(`[UserAction] ${action}`, properties);
  
  const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
  if (endpoint) {
    fetch(`${endpoint}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        properties,
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId(),
        userId,
        page: window.location.pathname,
      }),
    }).catch(() => {});
  }
}

export function trackAPICall(
  apiEndpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  error?: Error
): void {
  const success = statusCode >= 200 && statusCode < 400;
  
  console.info(`[APICall] ${method} ${apiEndpoint} - ${statusCode} (${duration.toFixed(0)}ms)`);
  
  const monitoringEndpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
  if (monitoringEndpoint) {
    fetch(`${monitoringEndpoint}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: apiEndpoint,
        method,
        duration,
        statusCode,
        success,
        error: error?.message,
        timestamp: new Date().toISOString(),
        sessionId: generateSessionId(),
        userId,
      }),
    }).catch(() => {});
  }
}

export function getWebVitals(): Promise<{
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      resolve({ fcp: null, lcp: null, fid: null, cls: null, ttfb: null });
      return;
    }

    const metrics: Record<string, number> = {};
    let observer: PerformanceObserver | null = null;

    const timeout = setTimeout(() => {
      if (observer) observer.disconnect();
      resolve({
        fcp: metrics.fcp || null,
        lcp: metrics.lcp || null,
        fid: metrics.fid || null,
        cls: metrics.cls || null,
        ttfb: metrics.ttfb || null,
      });
    }, 10000);

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            metrics.fcp = entry.startTime;
          }
          if (entry.entryType === 'largest-contentful-paint') {
            metrics.lcp = entry.startTime;
          }
          if (entry.entryType === 'first-input') {
            metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
          }
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            metrics.cls = (metrics.cls || 0) + (entry as any).value;
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });

      if (window.performance.timing) {
        metrics.ttfb = window.performance.timing.responseStart - window.performance.timing.navigationStart;
      }
    } catch {
      clearTimeout(timeout);
      resolve({ fcp: null, lcp: null, fid: null, cls: null, ttfb: null });
    }
  });
}

export function reportWebVitals(): void {
  if (typeof window === 'undefined') return;

  getWebVitals().then((vitals) => {
    console.info('[WebVitals]', vitals);
    
    const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT;
    if (endpoint) {
      fetch(`${endpoint}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vitals,
          timestamp: new Date().toISOString(),
          sessionId: generateSessionId(),
          userId,
          url: window.location.href,
        }),
      }).catch(() => {});
    }
  });
}
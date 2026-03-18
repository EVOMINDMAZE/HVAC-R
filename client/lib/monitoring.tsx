/**
 * Monitoring and Observability Module
 * 
 * Provides comprehensive application performance monitoring (APM),
 * error tracking, and performance metrics collection.
 * 
 * @module monitoring
 */

import { createContext, useContext, useEffect, useRef, useCallback } from 'react';

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

export interface MonitoringContextValue {
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

export const MonitoringContext = createContext<MonitoringContextValue | null>(null);

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

function getMonitoringUserId(): string | undefined {
  return userId;
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

export function processLogEntry(entry: LogEntry): void {
  sendToConsole(entry);
  sendToRemote(entry);
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

export {
  generateSessionId,
  getMonitoringUserId,
};

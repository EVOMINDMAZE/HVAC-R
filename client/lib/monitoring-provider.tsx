import { type FC, type ReactNode, useCallback, useEffect, useRef } from 'react';

import {
  type ErrorEvent,
  type LogLevel,
  MonitoringContext,
  type PerformanceMetric,
  generateSessionId,
  getMonitoringUserId,
  processLogEntry,
} from './monitoring';

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
      userId: getMonitoringUserId(),
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
      userId: getMonitoringUserId(),
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
  const getUserId = useCallback(() => getMonitoringUserId(), []);

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
};

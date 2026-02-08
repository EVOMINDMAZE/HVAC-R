import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  query?: Record<string, string>;
  bodySize?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: Date;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  error?: Error;
}

const requestLog: RequestMetrics[] = [];
const performanceMetrics: PerformanceMetric[] = [];
const errorLog: LogEntry[] = [];

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
const CURRENT_LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as typeof LOG_LEVELS[number];

function shouldLog(level: typeof LOG_LEVELS[number]): boolean {
  const levels = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(CURRENT_LOG_LEVEL);
}

function formatLogEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const extras: Record<string, unknown> = {};
  if (entry.requestId) extras.requestId = entry.requestId;
  if (entry.userId) extras.userId = entry.userId;
  if (entry.context) extras.context = entry.context;
  
  let formatted = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  if (Object.keys(extras).length > 0) {
    formatted += ` ${JSON.stringify(extras)}`;
  }
  if (entry.error) {
    formatted += `\n${entry.error.stack || entry.error.message}`;
  }
  return formatted;
}

function sendToConsole(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;
  
  const formatted = formatLogEntry(entry);
  switch (entry.level) {
    case 'error':
      console.error(formatted);
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
  const endpoint = process.env.MONITORING_ENDPOINT;
  if (!endpoint) return;
  
  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
  } catch {
    console.warn('Failed to send log to remote endpoint');
  }
}

function processLog(entry: LogEntry): void {
  sendToConsole(entry);
  sendToRemote(entry);
  
  if (entry.level === 'error') {
    errorLog.push(entry);
    if (errorLog.length > 1000) {
      errorLog.shift();
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  const startTime = Date.now();
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const originalSend = res.send;
  let responseBodySize = 0;
  
  res.send = function(body) {
    responseBodySize = Buffer.byteLength(body as string || '');
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.id;
    const sessionId = req.session?.id;
    
    const metrics: RequestMetrics = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userId,
      sessionId,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      query: req.query as Record<string, string>,
      bodySize: responseBodySize,
    };
    
    requestLog.push(metrics);
    if (requestLog.length > 10000) {
      requestLog.shift();
    }
    
    if (res.statusCode >= 400) {
      processLog({
        level: res.statusCode >= 500 ? 'error' : 'warn',
        message: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
        timestamp: new Date(),
        requestId,
        userId,
        context: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        },
      });
    }
    
    trackPerformance('http_request_duration', duration, 'ms', {
      method: req.method,
      path: req.path.split('/')[1] || 'unknown',
      statusCode: String(res.statusCode),
    });
  });

  next();
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const userId = (req as any).user?.id;
  
  processLog({
    level: 'error',
    message: err.message,
    timestamp: new Date(),
    requestId,
    userId,
    context: {
      method: req.method,
      path: req.path,
      stack: err.stack,
    },
    error: err,
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    requestId,
  });
}

export function trackPerformance(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  tags?: Record<string, string>
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    tags,
    timestamp: new Date(),
  };
  
  performanceMetrics.push(metric);
  if (performanceMetrics.length > 10000) {
    performanceMetrics.shift();
  }
  
  console.log(`[Metrics] ${name}: ${value}${unit}`, tags);
}

export function log(
  level: LogEntry['level'],
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): void {
  processLog({
    level,
    message,
    timestamp: new Date(),
    context,
    error,
  });
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  log('info', message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  log('warn', message, context);
}

export function logError(message: string, error?: Error, context?: Record<string, unknown>): void {
  log('error', message, context, error);
}

export function logDebug(message: string, context?: Record<string, unknown>): void {
  log('debug', message, context);
}

export function getRequestLog(filters?: {
  startDate?: Date;
  endDate?: Date;
  method?: string;
  path?: string;
  statusCode?: number;
}): RequestMetrics[] {
  let logs = [...requestLog];
  
  if (filters?.startDate) {
    logs = logs.filter(l => l.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    logs = logs.filter(l => l.timestamp <= filters.endDate!);
  }
  if (filters?.method) {
    logs = logs.filter(l => l.method === filters.method);
  }
  if (filters?.path) {
    logs = logs.filter(l => l.path.includes(filters.path!));
  }
  if (filters?.statusCode) {
    logs = logs.filter(l => l.statusCode === filters.statusCode);
  }
  
  return logs;
}

export function getPerformanceMetrics(filters?: {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}): PerformanceMetric[] {
  let metrics = [...performanceMetrics];
  
  if (filters?.name) {
    metrics = metrics.filter(m => m.name === filters.name);
  }
  if (filters?.startDate) {
    metrics = metrics.filter(m => m.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    metrics = metrics.filter(m => m.timestamp <= filters.endDate!);
  }
  
  return metrics;
}

export function getErrorLog(filters?: {
  startDate?: Date;
  endDate?: Date;
  level?: LogEntry['level'];
}): LogEntry[] {
  let logs = [...errorLog];
  
  if (filters?.startDate) {
    logs = logs.filter(l => l.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    logs = logs.filter(l => l.timestamp <= filters.endDate!);
  }
  if (filters?.level) {
    logs = logs.filter(l => l.level === filters.level);
  }
  
  return logs;
}

export function getHealthMetrics(): {
  requests: { total: number; errors: number; avgDuration: number };
  performance: { avgResponseTime: number; p95ResponseTime: number; p99ResponseTime: number };
  errors: { total: number; byLevel: Record<string, number> };
} {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const recentRequests = requestLog.filter(r => r.timestamp >= oneHourAgo);
  const recentErrors = errorLog.filter(e => e.timestamp >= oneHourAgo);
  
  const total = recentRequests.length;
  const errors = recentRequests.filter(r => r.statusCode >= 400).length;
  const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
  
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  const p95Duration = durations[p95Index] || 0;
  const p99Duration = durations[p99Index] || 0;
  
  const byLevel: Record<string, number> = {};
  recentErrors.forEach(e => {
    byLevel[e.level] = (byLevel[e.level] || 0) + 1;
  });
  
  return {
    requests: {
      total,
      errors,
      avgDuration: Math.round(avgDuration),
    },
    performance: {
      avgResponseTime: Math.round(avgDuration),
      p95ResponseTime: Math.round(p95Duration),
      p99ResponseTime: Math.round(p99Duration),
    },
    errors: {
      total: recentErrors.length,
      byLevel,
    },
  };
}

export function createAPITimer(name: string) {
  const startTime = Date.now();
  return () => {
    const duration = Date.now() - startTime;
    trackPerformance(name, duration, 'ms', {
      endpoint: name,
    });
    return duration;
  };
}

export function countRequests(method: string, path: string): number {
  return requestLog.filter(r => r.method === method && r.path === path).length;
}

export function averageResponseTime(method: string, path: string): number {
  const relevant = requestLog.filter(r => r.method === method && r.path === path);
  if (relevant.length === 0) return 0;
  
  const total = relevant.reduce((sum, r) => sum + r.duration, 0);
  return total / relevant.length;
}

export function errorRate(method: string, path: string): number {
  const relevant = requestLog.filter(r => r.method === method && r.path === path);
  if (relevant.length === 0) return 0;
  
  const errors = relevant.filter(r => r.statusCode >= 400).length;
  return (errors / relevant.length) * 100;
}

export function getTopEndpoints(limit: number = 10): Array<{
  path: string;
  method: string;
  count: number;
  avgDuration: number;
  errorRate: number;
}> {
  const endpointMap = new Map<string, {
    path: string;
    method: string;
    count: number;
    totalDuration: number;
    errors: number;
  }>();
  
  requestLog.forEach(r => {
    const key = `${r.method}:${r.path}`;
    const existing = endpointMap.get(key) || {
      path: r.path,
      method: r.method,
      count: 0,
      totalDuration: 0,
      errors: 0,
    };
    
    existing.count++;
    existing.totalDuration += r.duration;
    if (r.statusCode >= 400) {
      existing.errors++;
    }
    
    endpointMap.set(key, existing);
  });
  
  return Array.from(endpointMap.values())
    .map(e => ({
      path: e.path,
      method: e.method,
      count: e.count,
      avgDuration: Math.round(e.totalDuration / e.count),
      errorRate: Math.round((e.errors / e.count) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function cleanupOldLogs(maxAge: number = 24 * 60 * 60 * 1000): void {
  const cutoff = new Date(Date.now() - maxAge);
  
  const requestCutoff = new Date(Date.now() - maxAge);
  const perfCutoff = new Date(Date.now() - maxAge);
  const errorCutoff = new Date(Date.now() - maxAge);
  
  while (requestLog.length > 0 && requestLog[0].timestamp < requestCutoff) {
    requestLog.shift();
  }
  
  while (performanceMetrics.length > 0 && performanceMetrics[0].timestamp < perfCutoff) {
    performanceMetrics.shift();
  }
  
  while (errorLog.length > 0 && errorLog[0].timestamp < errorCutoff) {
    errorLog.shift();
  }
}

setInterval(() => cleanupOldLogs(), 60 * 60 * 1000);

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
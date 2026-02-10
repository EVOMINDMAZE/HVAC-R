/**
 * Datadog APM Integration for React Frontend
 * 
 * This module configures Datadog Real User Monitoring (RUM)
 * for performance tracking and user analytics.
 * 
 * @module datadog-rum
 */

import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

const DATADOG_CLIENT_TOKEN = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
const DATADOG_APPLICATION_ID = import.meta.env.VITE_DATADOG_APPLICATION_ID;
const DATADOG_ENVIRONMENT = import.meta.env.VITE_DATADOG_ENVIRONMENT || 'development';
const DATADOG_SERVICE = import.meta.env.VITE_DATADOG_SERVICE || 'thermoneural-web';

export const isDatadogEnabled = !!(DATADOG_CLIENT_TOKEN && DATADOG_APPLICATION_ID);

export function initDatadog() {
  if (!isDatadogEnabled) {
    console.warn('[Datadog] Datadog is not configured. RUM disabled.');
    return;
  }

  try {
    datadogRum.init({
      applicationId: DATADOG_APPLICATION_ID,
      clientToken: DATADOG_CLIENT_TOKEN,
      env: DATADOG_ENVIRONMENT,
      service: DATADOG_SERVICE,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      sessionSampleRate: 100,
      telemetrySampleRate: 20,
      
      trackInteractions: true,
      trackFrustrations: true,
      trackUserInteractions: true,
      
      defaultPrivacyLevel: 'mask-user-input',
      
      allowedTracingOrigins: [
        'localhost',
        'https://api.thermoneural.com',
        'https://api-staging.thermoneural.com',
      ],
      
      trackResources: true,
      trackLongTasks: true,
      
      beforeSend: (event) => {
        if (event.type === 'error' && event.error?.message?.includes('ResizeObserver')) {
          return false;
        }
        return true;
      },
      
      onReady: () => {
        console.log('[Datadog] RUM initialized successfully');
      },
      
      onLog: (log) => {
        console.log('[Datadog] Log:', log);
      },
    });

    datadogLogs.init({
      clientToken: DATADOG_CLIENT_TOKEN,
      env: DATADOG_ENVIRONMENT,
      service: DATADOG_SERVICE,
      version: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      forwardErrorsToLogs: true,
      sampleRate: 100,
      
      beforeSend: (log) => {
        if (log.message?.includes('ResizeObserver')) {
          return false;
        }
        return true;
      },
    });

    console.log('[Datadog] Logs and RUM initialized');
  } catch (error) {
    console.error('[Datadog] Failed to initialize:', error);
  }
}

export function setDatadogUser(user: { id: string; email?: string; name?: string; role?: string; companyId?: string } | null) {
  if (!isDatadogEnabled) return;

  datadogRum.setUser({
    id: user?.id,
    email: user?.email,
    name: user?.name,
    role: user?.role,
    companyId: user?.companyId,
  });
}

export function setDatadogGlobalContext(context: Record<string, unknown>) {
  if (!isDatadogEnabled) return;
  datadogRum.addGlobalContext(context);
}

export function removeDatadogGlobalContext(key: string) {
  if (!isDatadogEnabled) return;
  datadogRum.removeGlobalContext(key);
}

export function addDatadogAction(name: string, context?: Record<string, unknown>) {
  if (!isDatadogEnabled) return;
  datadogRum.addAction(name, context);
}

export function startDatadogView(viewName: string, url?: string) {
  if (!isDatadogEnabled) return;
  datadogRum.startView({
    name: viewName,
    url: url || window.location.href,
  });
}

export function stopDatadogView() {
  if (!isDatadogEnabled) return;
  datadogRum.stopView();
}

export function logToDatadog(
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  if (!isDatadogEnabled) {
    console.log(`[Datadog] ${level}: ${message}`, context);
    return;
  }

  datadogLogs.logger.log(message, {
    level,
    ...context,
  });
}

export function trackDatadogPerformance(
  name: string,
  duration: number,
  context?: Record<string, unknown>
) {
  if (!isDatadogEnabled) return;

  datadogRum.addTiming(name, duration);
  
  datadogLogs.logger.log(`Performance: ${name}`, {
    level: 'info',
    duration_ms: duration,
    ...context,
  });
}

export function trackDatadogError(error: Error, context?: Record<string, unknown>) {
  if (!isDatadogEnabled) {
    console.error('[Datadog] Error (not sent):', error);
    return;
  }

  datadogRum.addError(error, context);
  
  datadogLogs.logger.log(`Error: ${error.message}`, {
    level: 'error',
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
}

export function trackDatadogResource(
  url: string,
  method: string,
  statusCode: number,
  duration: number
) {
  if (!isDatadogEnabled) return;

  datadogRum.addResource(
    url,
    {
      method,
      statusCode,
      duration,
      type: 'fetch',
    }
  );
}

export function trackDatadogFrustration(
  type: 'rage_click' | 'dead_click' | 'error_click' | 'scroll_error',
  target?: string
) {
  if (!isDatadogEnabled) return;

  datadogRum.addFrustration(type);
  
  datadogLogs.logger.log(`Frustration: ${type}`, {
    level: 'warning',
    frustration_type: type,
    target,
  });
}

export function getDatadogSessionId(): string | null {
  if (!isDatadogEnabled) return null;
  return (window.DD_RUM as any)?.getInternalContext?.()?.session_id || null;
}

export function getDatadogUserActionCount(): number {
  if (!isDatadogEnabled) return 0;
  return (window.DD_RUM as any)?.getUserActionCount?.() || 0;
}

export {
  datadogRum,
} from '@datadog/browser-rum';
export { datadogLogs } from '@datadog/browser-logs';

export type { RumUser, RumAction, RumResource, RumError, RumTiming } from '@datadog/browser-rum';

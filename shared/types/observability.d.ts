declare module "@datadog/browser-rum" {
  export const datadogRum: any;
  export type RumUser = any;
  export type RumAction = any;
  export type RumResource = any;
  export type RumError = any;
  export type RumTiming = any;
}

declare module "@datadog/browser-logs" {
  export const datadogLogs: any;
}

declare module "@sentry/replay" {
  export class BrowserTracing {
    constructor(config?: Record<string, unknown>);
  }
}

declare module "@sentry/react" {
  export const Sentry: any;
  export const init: any;
  export const Replay: any;
  export const reactRouterV6Instrumentation: any;
  export const withSentryRouting: any;
  export const withReactRouter6Routing: any;
  export const setUser: any;
  export const setTag: any;
  export const setContext: any;
  export const addBreadcrumb: any;
  export const captureException: any;
  export const captureMessage: any;
  export const startTransaction: any;
  export const profiler: any;
  export const ErrorBoundary: any;
  export const showReportDialog: any;
  export const useRouteError: any;
  export const useLastError: any;
  export type Breadcrumb = any;
  export type User = any;
}

declare module "@sentry/node" {
  export const Sentry: any;
  export const init: any;
  export const Handlers: any;
  export const Integrations: any;
  export const setUser: any;
  export const setTag: any;
  export const setContext: any;
  export const addBreadcrumb: any;
  export const captureException: any;
  export const captureMessage: any;
  export const startTransaction: any;
  export const getCurrentScope: any;
  export type Event = any;
  export type Exception = any;
  export type Breadcrumb = any;
  export type User = any;
}

declare module "@sentry/profiling-node" {
  export class ProfilingIntegration {
    constructor(...args: any[]);
  }
}

declare module "dd-trace" {
  export const tracer: any;
  export const logger: any;
  export const metrics: any;
  export const profile: any;
  export type Span = any;
  export type Tracer = any;
  export type Logger = any;
  export type Metrics = any;
}

interface Window {
  DD_RUM?: {
    getInternalContext?: () => { session_id?: string };
    getUserActionCount?: () => number;
  };
}

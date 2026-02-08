import packageJson from '../package.json';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';

export const sentryServerConfig = {
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: packageJson.version || process.env.SENTRY_RELEASE || 'unknown',
  
  integrations: [
    import('@sentry/node').then(({ Http, ProfilingIntegration }) => [
      new Http({ tracing: true }),
      new ProfilingIntegration(),
    ]),
  ],
  
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error?.message?.includes('ECONNRESET')) return null;
    if (error?.message?.includes('ETIMEDOUT')) return null;
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
      application: 'thermoneural-api',
      version: packageJson.version || 'unknown',
    },
  },
  
  maxBreadcrumbs: 100,
  attachStacktrace: true,
  sendDefaultPii: false,
};

export { SENTRY_DSN, SENTRY_ENVIRONMENT };
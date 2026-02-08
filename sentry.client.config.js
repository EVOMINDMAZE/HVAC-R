import packageJson from '../../package.json';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

export const sentryClientConfig = {
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: packageJson.version,
  
  integrations: [
    import('@sentry/react').then(({ BrowserTracing, Replay }) => [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          'https://api.thermoneural.com',
          'https://api-staging.thermoneural.com',
        ],
      }),
      new Replay({
        maskAllText: true,
        blockAllMedia: true,
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
      }),
    ]),
  ],
  
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error?.message?.includes('ResizeObserver')) return null;
    if (error?.message?.includes('Non-Error exception captured')) return null;
    return event;
  },
  
  initialScope: {
    tags: {
      application: 'thermoneural-web',
      version: packageJson.version,
    },
  },
  
  maxBreadcrumbs: 100,
  attachStacktrace: true,
  sendDefaultPii: false,
};

export const sentryReplayConfig = {
  maskAllText: true,
  blockAllMedia: true,
  sessionSampleRate: 0.1,
  errorSampleRate: 1.0,
  
  overlay: {
    insertStyles: true,
    emphasizeError: true,
    shakeOnError: true,
  },
  
  captureOnlyOnError: false,
  
  async beforeAddBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    return breadcrumb;
  },
};

export { SENTRY_DSN, SENTRY_ENVIRONMENT };
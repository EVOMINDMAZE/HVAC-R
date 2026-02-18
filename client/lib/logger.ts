type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDev = import.meta.env.DEV;
const minLogLevel = isDev ? LOG_LEVELS.debug : LOG_LEVELS.error;

function formatMessage(level: LogLevel, context: string, ..._args: unknown[]): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
}

export const logger = {
  debug(context: string, ...args: unknown[]): void {
    if (minLogLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', context), ...args);
    }
  },

  info(context: string, ...args: unknown[]): void {
    if (minLogLevel <= LOG_LEVELS.info) {
      console.info(formatMessage('info', context), ...args);
    }
  },

  warn(context: string, ...args: unknown[]): void {
    if (minLogLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', context), ...args);
    }
  },

  error(context: string, ...args: unknown[]): void {
    if (minLogLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', context), ...args);
    }
  },

  group(label: string, fn: () => void): void {
    if (isDev) {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  },
};

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}

export function devError(...args: unknown[]): void {
  if (isDev) {
    console.error(...args);
  }
}
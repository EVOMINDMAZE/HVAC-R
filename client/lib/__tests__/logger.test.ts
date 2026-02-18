import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, devLog, devWarn, devError } from '../logger';

vi.mock('import.meta', () => ({
  env: {
    DEV: true,
    PROD: false,
  },
}));

describe('logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in dev mode', () => {
      logger.debug('TestContext', 'Debug message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should include context in message', () => {
      logger.debug('TestContext', 'Debug message');
      const call = consoleDebugSpy.mock.calls[0];
      expect(call?.[0]).toContain('TestContext');
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('TestContext', 'Info message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('TestContext', 'Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('TestContext', 'Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('group', () => {
    it('should create console group', () => {
      logger.group('TestGroup', () => {
        logger.info('TestContext', 'Inside group');
      });
      expect(consoleGroupSpy).toHaveBeenCalledWith('TestGroup');
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });

    it('should always call groupEnd even if callback throws', () => {
      expect(() => {
        logger.group('TestGroup', () => {
          throw new Error('Test error');
        });
      }).toThrow();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });
});

describe('devLog', () => {
  it('should log in dev mode', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog('Test message');
    expect(consoleSpy).toHaveBeenCalledWith('Test message');
    consoleSpy.mockRestore();
  });
});

describe('devWarn', () => {
  it('should warn in dev mode', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    devWarn('Test warning');
    expect(consoleSpy).toHaveBeenCalledWith('Test warning');
    consoleSpy.mockRestore();
  });
});

describe('devError', () => {
  it('should error in dev mode', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    devError('Test error');
    expect(consoleSpy).toHaveBeenCalledWith('Test error');
    consoleSpy.mockRestore();
  });
});
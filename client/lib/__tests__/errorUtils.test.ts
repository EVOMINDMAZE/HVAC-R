import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractErrorMessage, isError, logError } from '../errorUtils';

describe('errorUtils', () => {
  describe('extractErrorMessage', () => {
    it('should return default message for null/undefined', () => {
      expect(extractErrorMessage(null)).toBe('Unknown error occurred');
      expect(extractErrorMessage(undefined)).toBe('Unknown error occurred');
    });

    it('should return string as-is', () => {
      expect(extractErrorMessage('Test error')).toBe('Test error');
    });

    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(extractErrorMessage(error)).toBe('Test error message');
    });

    it('should extract message from error-like objects', () => {
      const error = { message: 'Custom error' };
      expect(extractErrorMessage(error)).toBe('Custom error');
    });

    it('should extract error_description', () => {
      const error = { error_description: 'OAuth error description' };
      expect(extractErrorMessage(error)).toBe('OAuth error description');
    });

    it('should handle known error codes', () => {
      const error = { code: 'PGRST116' };
      expect(extractErrorMessage(error)).toBe('Table does not exist in database (PGRST116)');
    });

    it('should handle unknown error codes', () => {
      const error = { code: 'UNKNOWN_CODE' };
      expect(extractErrorMessage(error)).toBe('Database error: UNKNOWN_CODE');
    });

    it('should extract from nested response.data', () => {
      const error = {
        response: {
          data: { message: 'Nested error' }
        }
      };
      expect(extractErrorMessage(error)).toBe('Nested error');
    });

    it('should handle circular reference objects', () => {
      const circular: Record<string, unknown> = { name: 'circular' };
      circular.self = circular;
      const result = extractErrorMessage(circular);
      expect(typeof result).toBe('string');
    });
  });

  describe('isError', () => {
    it('should return true for Error objects', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
      expect(isError(new RangeError('test'))).toBe(true);
    });

    it('should return false for non-Error objects', () => {
      expect(isError('string')).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({ message: 'test' })).toBe(false);
    });
  });

  describe('logError', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should log Error objects correctly', () => {
      const error = new Error('Test error');
      logError('TestContext', error);
      
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Error in TestContext');
    });

    it('should log string errors correctly', () => {
      logError('TestContext', 'String error');
      
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Error in TestContext');
    });

    it('should handle unknown error types', () => {
      logError('TestContext', { unknown: 'object' });
      
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Error in TestContext');
    });
  });
});
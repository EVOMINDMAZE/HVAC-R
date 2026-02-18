import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  shouldBypassAuth,
  shouldBypassAuthWithEnv,
  isFutureMonitorsEnabled,
  getFutureMonitorsSkin,
} from "../featureFlags";

const mockWindow = {
  location: {
    search: '',
    href: '',
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
};

vi.stubGlobal('window', mockWindow);
vi.stubGlobal('localStorage', mockWindow.localStorage);

vi.mock('import.meta', () => ({
  env: {
    DEV: true,
    PROD: false,
  },
}));

describe('featureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.location.search = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldBypassAuth', () => {
    it('should return false when no bypass params are set', () => {
      mockWindow.location.search = '';
      mockWindow.localStorage.getItem.mockReturnValue(null);
      
      expect(shouldBypassAuth()).toBe(false);
    });

    it('should return true when bypassAuth=1 in URL and in dev mode', () => {
      mockWindow.location.search = '?bypassAuth=1';
      
      expect(shouldBypassAuth()).toBe(true);
    });

    it('should return false when bypassAuth is not 1', () => {
      mockWindow.location.search = '?bypassAuth=0';
      
      expect(shouldBypassAuth()).toBe(false);
    });

    it("is provably disabled in production env", () => {
      expect(
        shouldBypassAuthWithEnv({
          env: { DEV: false, PROD: true },
          search: "?bypassAuth=1",
        }),
      ).toBe(false);
    });

    it('should handle SSR gracefully', () => {
      const originalWindow = global.window;
      vi.stubGlobal('window', undefined);
      
      expect(shouldBypassAuth()).toBe(false);
      
      vi.stubGlobal('window', originalWindow);
    });
  });

  describe('isFutureMonitorsEnabled', () => {
    it('should return true by default', () => {
      mockWindow.location.search = '';
      
      expect(isFutureMonitorsEnabled()).toBe(true);
    });

    it('should return true when uiFuture=1', () => {
      mockWindow.location.search = '?uiFuture=1';
      
      expect(isFutureMonitorsEnabled()).toBe(true);
    });

    it('should return false when uiFuture=0', () => {
      mockWindow.location.search = '?uiFuture=0';
      
      expect(isFutureMonitorsEnabled()).toBe(false);
    });
  });

  describe('getFutureMonitorsSkin', () => {
    it('should return hud by default', () => {
      mockWindow.location.search = '';
      
      expect(getFutureMonitorsSkin()).toBe('hud');
    });

    it('should return hud when uiFutureSkin=hud', () => {
      mockWindow.location.search = '?uiFutureSkin=hud';
      
      expect(getFutureMonitorsSkin()).toBe('hud');
    });

    it('should return infographic when uiFutureSkin=infographic', () => {
      mockWindow.location.search = '?uiFutureSkin=infographic';
      
      expect(getFutureMonitorsSkin()).toBe('infographic');
    });

    it('should return classic when uiFutureSkin=classic', () => {
      mockWindow.location.search = '?uiFutureSkin=classic';
      
      expect(getFutureMonitorsSkin()).toBe('classic');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFeatureAccess, useProFeature, useBusinessFeature } from '../useFeatureAccess';
import { useSubscription } from '../useStripe';
import { useSupabaseAuth } from '../useSupabaseAuth';

// Mock dependencies
vi.mock('../useStripe');
vi.mock('../useSupabaseAuth');

const mockUseSubscription = vi.mocked(useSubscription);
const mockUseSupabaseAuth = vi.mocked(useSupabaseAuth);

describe('useFeatureAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    mockUseSubscription.mockReturnValue({
      subscription: { subscription: null, plan: 'free', status: 'active' },
      loading: false,
      refetch: vi.fn(),
    });
    mockUseSupabaseAuth.mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isRefreshing: false,
      isAuthenticated: false,
      role: null,
      companyId: null,
      companies: [],
      activeCompany: null,
      needsCompanySelection: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      updateUser: vi.fn(),
      switchCompany: vi.fn(),
      getAllCompanies: vi.fn(),
      refreshCompanies: vi.fn(),
    });
  });

  describe('tier hierarchy', () => {
    it('should grant access when current tier equals required tier', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'pro', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro', featureName: 'Test Feature' })
      );

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.currentTier).toBe('pro');
      expect(result.current.requiredTier).toBe('pro');
    });

    it('should grant access when current tier is higher than required tier', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'business', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro', featureName: 'Test Feature' })
      );

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.currentTier).toBe('business');
      expect(result.current.requiredTier).toBe('pro');
    });

    it('should deny access when current tier is lower than required tier', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'free', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro', featureName: 'Test Feature' })
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.currentTier).toBe('free');
      expect(result.current.requiredTier).toBe('pro');
    });

    it('should handle legacy plan names (solo -> pro, enterprise -> business)', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'solo', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro', featureName: 'Test Feature' })
      );

      expect(result.current.hasAccess).toBe(true);
      expect(result.current.currentTier).toBe('pro');
    });
  });

  describe('explicit current tier', () => {
    it('should use explicit current tier when provided', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'business', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({
          requiredTier: 'pro',
          currentTier: 'free', // Override subscription data
          featureName: 'Test Feature',
        })
      );

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.currentTier).toBe('free');
    });
  });

  describe('helper hooks', () => {
    it('useProFeature should require pro tier', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'free', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useProFeature('Pro Feature'));

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.requiredTier).toBe('pro');
    });

    it('useBusinessFeature should require business tier', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'pro', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useBusinessFeature('Business Feature'));

      expect(result.current.hasAccess).toBe(false);
      expect(result.current.requiredTier).toBe('business');
    });
  });

  describe('helper functions', () => {
    it('withAccess should execute callback when access granted', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'pro', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro' })
      );

      const mockCallback = vi.fn();
      const wrappedCallback = result.current.withAccess(mockCallback);
      wrappedCallback('arg1', 2);

      expect(mockCallback).toHaveBeenCalledWith('arg1', 2);
    });

    it('withAccess should execute fallback when access denied', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'free', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro' })
      );

      const mockCallback = vi.fn();
      const mockFallback = vi.fn();
      const wrappedCallback = result.current.withAccess(mockCallback, mockFallback);
      wrappedCallback('arg1', 2);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(mockFallback).toHaveBeenCalledWith('arg1', 2);
    });

    it('guard should return true when access granted', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'pro', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro' })
      );

      const callback = vi.fn();
      const hasAccess = result.current.guard(callback);

      expect(hasAccess).toBe(true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('guard should execute callback when access denied', () => {
      mockUseSubscription.mockReturnValue({
        subscription: { subscription: null, plan: 'free', status: 'active' },
        loading: false,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() =>
        useFeatureAccess({ requiredTier: 'pro' })
      );

      const callback = vi.fn();
      const hasAccess = result.current.guard(callback);

      expect(hasAccess).toBe(false);
      expect(callback).toHaveBeenCalled();
    });
  });
});
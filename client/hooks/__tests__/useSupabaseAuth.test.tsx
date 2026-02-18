import { describe, it, expect, vi } from "vitest";

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

vi.mock('@/utils/authErrorHandler', () => ({
  isTokenError: vi.fn().mockReturnValue(false),
  AuthErrorHandler: {
    handle: vi.fn(),
  },
}));

describe('useSupabaseAuth', () => {
  it('exports the hook', async () => {
    const { useSupabaseAuth } = await import('../useSupabaseAuth');
    expect(typeof useSupabaseAuth).toBe('function');
  });

  it('exports the provider', async () => {
    const { SupabaseAuthProvider } = await import('../useSupabaseAuth');
    expect(SupabaseAuthProvider).toBeDefined();
  });

  it('exports useMultiCompanyAuth', async () => {
    const { useMultiCompanyAuth } = await import('../useSupabaseAuth');
    expect(typeof useMultiCompanyAuth).toBe('function');
  });

  it('exports useAuth alias', async () => {
    const { useAuth } = await import('../useSupabaseAuth');
    expect(typeof useAuth).toBe('function');
  });
});

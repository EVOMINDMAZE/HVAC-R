import { describe, it, expect, vi } from "vitest";

vi.mock('@/hooks/useSupabaseAuth', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    companyId: null,
    isAuthenticated: false,
  }),
}));

describe('useAppNavigation', () => {
  it('exports the hook', async () => {
    const { useAppNavigation } = await import('../useAppNavigation');
    expect(typeof useAppNavigation).toBe('function');
  });

  it('exports CALCULATOR_DETAILS', async () => {
    const { CALCULATOR_DETAILS } = await import('../useAppNavigation');
    expect(CALCULATOR_DETAILS).toBeDefined();
    expect(typeof CALCULATOR_DETAILS).toBe('object');
  });

  it('has calculator details for standard cycle', async () => {
    const { CALCULATOR_DETAILS } = await import('../useAppNavigation');
    expect(CALCULATOR_DETAILS['/tools/standard-cycle']).toBeDefined();
    expect(CALCULATOR_DETAILS["/tools/standard-cycle"]!.desc).toContain(
      "baseline",
    );
  });

  it('has calculator details for refrigerant comparison', async () => {
    const { CALCULATOR_DETAILS } = await import('../useAppNavigation');
    expect(CALCULATOR_DETAILS['/tools/refrigerant-comparison']).toBeDefined();
  });
});

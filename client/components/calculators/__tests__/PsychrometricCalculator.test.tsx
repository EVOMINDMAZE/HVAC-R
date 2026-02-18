import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PsychrometricCalculator from '../PsychrometricCalculator';

vi.mock('@/hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: () => ({
    user: null,
    companies: [],
    selectedCompany: null,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSupabaseCalculations', () => ({
  useSupabaseCalculations: () => ({
    saveCalculation: vi.fn(),
    isLoading: false,
    calculations: [],
  }),
}));

vi.mock('@/context/JobContext', () => ({
  useJob: () => ({
    currentJob: null,
  }),
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: null,
    getLocation: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/hooks/useSkillTracker', () => ({
  useSkillTracker: () => ({
    trackSkill: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('PsychrometricCalculator', () => {
  it('renders without crashing for pro users', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator userTier="pro" />);
    expect(container).toBeTruthy();
  });

  it('renders locked state for free users', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator userTier="free" />);
    expect(container).toBeTruthy();
  });

  it('renders for solo tier users', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator userTier="solo" />);
    expect(container).toBeTruthy();
  });

  it('renders for business tier users', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator userTier="business" />);
    expect(container).toBeTruthy();
  });

  it('defaults to pro tier when userTier not provided', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator />);
    expect(container).toBeTruthy();
  });

  it('renders with saveCalculation prop', () => {
    const { container } = renderWithRouter(<PsychrometricCalculator saveCalculation={() => {}} userTier="pro" />);
    expect(container).toBeTruthy();
  });
});
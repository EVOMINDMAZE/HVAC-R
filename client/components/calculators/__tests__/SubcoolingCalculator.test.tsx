import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubcoolingCalculator from '../SubcoolingCalculator';

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

describe('SubcoolingCalculator', () => {
  it('renders without crashing', () => {
    const { container } = renderWithRouter(<SubcoolingCalculator />);
    expect(container).toBeTruthy();
  });

  it('renders with saveCalculation prop', () => {
    const { container } = renderWithRouter(<SubcoolingCalculator saveCalculation={() => {}} />);
    expect(container).toBeTruthy();
  });

  it('has input fields', () => {
    const { container } = renderWithRouter(<SubcoolingCalculator />);
    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
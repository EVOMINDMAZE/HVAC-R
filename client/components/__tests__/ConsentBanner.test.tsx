import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { ConsentBanner, useConsent } from '../ConsentBanner';

const mockAuth = {
  getUser: vi.fn(),
  getSession: vi.fn(),
};

vi.mock('@/lib/supabase', () => {
  return {
    getSupabaseOrThrow: () => ({
      auth: mockAuth,
    }),
  };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderWithRouter = (ui: JSX.Element) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('ConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockClear();
    
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuth.getSession.mockResolvedValue({ data: { session: { access_token: 'mock-token' } }, error: null });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, consent_id: 'test-123' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when visible is false', () => {
    const { container } = renderWithRouter(
      <ConsentBanner visible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when visible is true (default)', () => {
    renderWithRouter(<ConsentBanner />);
    expect(screen.getByText('Your Privacy Choices')).toBeInTheDocument();
    expect(screen.getByText(/We use cookies and similar technologies/)).toBeInTheDocument();
    expect(screen.getByText('Accept All')).toBeInTheDocument();
    expect(screen.getByText('Decline Non‑Essential')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('should show details when customize button is clicked', () => {
    renderWithRouter(<ConsentBanner />);
    
    // Details should be hidden initially
    expect(screen.queryByText('Essential Cookies')).not.toBeInTheDocument();
    
    // Click customize button
    fireEvent.click(screen.getByText('Customize'));
    
    // Details should be visible
    expect(screen.getByText('Essential Cookies')).toBeInTheDocument();
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(screen.getByText('Customize'));
    expect(screen.queryByText('Essential Cookies')).not.toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    renderWithRouter(<ConsentBanner onDismiss={onDismiss} />);
    
    // Find and click the close button (X)
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  describe('Accept All button', () => {
    it('should store consent in localStorage and call callbacks when clicked (unauthenticated)', async () => {
      const onConsentGranted = vi.fn();
      const onDismiss = vi.fn();
      renderWithRouter(<ConsentBanner onConsentGranted={onConsentGranted} onDismiss={onDismiss} />);
      
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      fireEvent.click(screen.getByText('Accept All'));
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(localStorage.getItem('consent_essential_cookies_v1.0')).toBe('true');
        expect(localStorage.getItem('consent_given')).toBe('true');
        expect(localStorage.getItem('consent_timestamp')).toBeTruthy();
        
        expect(onConsentGranted).toHaveBeenCalledTimes(1);
        expect(onDismiss).toHaveBeenCalledTimes(1);
        
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('should call API and store in localStorage when authenticated', async () => {
      const mockUser = { id: 'user-123' };
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockAuth.getSession.mockResolvedValue({ data: { session: { access_token: 'auth-token' } }, error: null });
      
      renderWithRouter(<ConsentBanner />);
      
      fireEvent.click(screen.getByText('Accept All'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith('/api/privacy/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer auth-token',
          },
          body: JSON.stringify({
            consent_type: 'essential_cookies',
            consent_version: 'v1.0',
            granted: true,
          }),
        });
        
        expect(localStorage.getItem('consent_essential_cookies_v1.0')).toBe('true');
        expect(localStorage.getItem('consent_given')).toBe('true');
      });
    });

    it('should handle API error gracefully and still store locally', async () => {
      const mockUser = { id: 'user-123' };
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      renderWithRouter(<ConsentBanner />);
      
      fireEvent.click(screen.getByText('Accept All'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        
        expect(localStorage.getItem('consent_essential_cookies_v1.0')).toBe('true');
        expect(localStorage.getItem('consent_given')).toBe('true');
      });
    });
  });

  describe('Decline Non‑Essential button', () => {
    it('should store declined consent in localStorage and call callbacks', () => {
      const onConsentDeclined = vi.fn();
      const onDismiss = vi.fn();
      renderWithRouter(<ConsentBanner onConsentDeclined={onConsentDeclined} onDismiss={onDismiss} />);
      
      fireEvent.click(screen.getByText('Decline Non‑Essential'));
      
      // localStorage should be updated with false for essential cookies
      expect(localStorage.getItem('consent_essential_cookies_v1.0')).toBe('false');
      expect(localStorage.getItem('consent_given')).toBe('false');
      expect(localStorage.getItem('consent_timestamp')).toBeTruthy();
      
      // Callbacks should be called
      expect(onConsentDeclined).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      
      // API should not be called (decline is client-only)
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

describe('useConsent hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockClear();
    
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    mockAuth.getSession.mockResolvedValue({ data: { session: { access_token: 'mock-token' } }, error: null });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hasConsent', () => {
    it('should return false when window is undefined', async () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      try {
        const { useConsent } = await import('../ConsentBanner');
        const { hasConsent } = useConsent();
        
        expect(hasConsent()).toBe(false);
      } finally {
        global.window = originalWindow;
      }
    });

    it('should return false when no consent given', () => {
      const { hasConsent } = useConsent();
      expect(hasConsent()).toBe(false);
    });

    it('should return true when consent given', () => {
      localStorage.setItem('consent_given', 'true');
      const { hasConsent } = useConsent();
      expect(hasConsent()).toBe(true);
    });
  });

  describe('getConsentVersion', () => {
    it('should return false when window is undefined', async () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      try {
        const { useConsent } = await import('../ConsentBanner');
        const { getConsentVersion } = useConsent();
        
        expect(getConsentVersion('essential_cookies', 'v1.0')).toBe(false);
      } finally {
        global.window = originalWindow;
      }
    });

    it('should return false when specific consent not given', () => {
      const { getConsentVersion } = useConsent();
      expect(getConsentVersion('essential_cookies', 'v1.0')).toBe(false);
    });

    it('should return true when specific consent given', () => {
      localStorage.setItem('consent_essential_cookies_v1.0', 'true');
      const { getConsentVersion } = useConsent();
      expect(getConsentVersion('essential_cookies', 'v1.0')).toBe(true);
    });
  });

  describe('recordConsent', () => {
    it('should do nothing when window is undefined', async () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      try {
        const { useConsent } = await import('../ConsentBanner');
        const { recordConsent } = useConsent();
        
        await recordConsent('essential_cookies', 'v1.0', true);
        
        expect(localStorage.length).toBe(0);
      } finally {
        global.window = originalWindow;
      }
    });

    it('should store consent in localStorage for unauthenticated user', async () => {
      const { recordConsent } = useConsent();
      
      await recordConsent('marketing_emails', 'v2.0', true);
      
      expect(localStorage.getItem('consent_marketing_emails_v2.0')).toBe('true');
      expect(localStorage.getItem('consent_given')).toBe('true');
      expect(localStorage.getItem('consent_timestamp')).toBeTruthy();
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call API and store locally for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const { recordConsent } = useConsent();
      
      await recordConsent('analytics_tracking', 'v1.5', false);
      
      expect(localStorage.getItem('consent_analytics_tracking_v1.5')).toBe('false');
      expect(localStorage.getItem('consent_given')).toBe('true');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/privacy/consent', {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringContaining('Bearer'),
        }),
        body: JSON.stringify({
          consent_type: 'analytics_tracking',
          consent_version: 'v1.5',
          granted: false,
        }),
      });
    });

    it('should handle API errors gracefully for authenticated user', async () => {
      const mockUser = { id: 'user-123' };
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock fetch to fail
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const { recordConsent } = useConsent();
      
      await recordConsent('essential_cookies', 'v1.0', true);
      
      // localStorage should still be updated despite API error
      expect(localStorage.getItem('consent_essential_cookies_v1.0')).toBe('true');
      expect(localStorage.getItem('consent_given')).toBe('true');
      
      // Error should be logged (we could spy on console.error here)
    });
  });
});

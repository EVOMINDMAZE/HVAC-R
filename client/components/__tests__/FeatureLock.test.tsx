import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureLock, FeatureBadge } from '../FeatureLock';

// Mock UpgradeModal to avoid complex dialog rendering
vi.mock('../UpgradeModal', () => ({
  UpgradeModal: vi.fn(({ children, requiredTier, currentTier, featureName }) => (
    <div data-testid="upgrade-modal">
      <span data-testid="required-tier">{requiredTier}</span>
      <span data-testid="current-tier">{currentTier}</span>
      <span data-testid="feature-name">{featureName}</span>
      {children}
    </div>
  )),
}));

describe('FeatureLock', () => {
  it('should render children normally when has access', () => {
    render(
      <FeatureLock
        requiredTier="pro"
        currentTier="pro"
        featureName="Test Feature"
      >
        <div data-testid="content">Protected Content</div>
      </FeatureLock>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    // No lock overlay should be visible
    expect(screen.queryByText(/locked/i)).not.toBeInTheDocument();
  });

  it('should render grayed-out overlay when access denied', () => {
    render(
      <FeatureLock
        requiredTier="pro"
        currentTier="free"
        featureName="Test Feature"
      >
        <div data-testid="content">Protected Content</div>
      </FeatureLock>
    );

    // Content should be present but grayed out (opacity class)
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content.closest('.opacity-50')).toBeInTheDocument();

    // Lock overlay should be visible
    expect(screen.getByText(/locked/i)).toBeInTheDocument();
    // There are multiple elements with "Upgrade to Pro" text
    expect(screen.getAllByText(/upgrade to pro/i).length).toBeGreaterThan(0);
  });

  it('should show upgrade modal when upgrade button clicked', () => {
    render(
      <FeatureLock
        requiredTier="business"
        currentTier="pro"
        featureName="Advanced Feature"
      >
        <div>Content</div>
      </FeatureLock>
    );

    // Upgrade modal should be rendered (via mock)
    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    expect(screen.getByTestId('required-tier')).toHaveTextContent('business');
    expect(screen.getByTestId('current-tier')).toHaveTextContent('pro');
    expect(screen.getByTestId('feature-name')).toHaveTextContent('Advanced Feature');
  });

  it('should respect disabled prop', () => {
    render(
      <FeatureLock
        requiredTier="pro"
        currentTier="free"
        featureName="Test Feature"
        disabled={true}
      >
        <div data-testid="content">Protected Content</div>
      </FeatureLock>
    );

    // When disabled, should render content normally (no lock overlay)
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByText(/locked/i)).not.toBeInTheDocument();
  });

  it('should apply custom class names', () => {
    const { container } = render(
      <FeatureLock
        requiredTier="pro"
        currentTier="free"
        featureName="Test Feature"
        className="custom-container"
        overlayClassName="custom-overlay"
      >
        <div>Content</div>
      </FeatureLock>
    );

    const containerElement = container.firstChild;
    expect(containerElement).toHaveClass('custom-container');
    // Overlay class is applied to inner div
    expect(container.querySelector('.custom-overlay')).toBeInTheDocument();
  });
});

describe('FeatureBadge', () => {
  it('should render nothing when has access', () => {
    const { container } = render(
      <FeatureBadge requiredTier="pro" currentTier="pro" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render badge when access denied', () => {
    render(
      <FeatureBadge requiredTier="pro" currentTier="free" />
    );

    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toHaveClass('bg-amber-100');
  });

  it('should render business badge for business tier', () => {
    render(
      <FeatureBadge requiredTier="business" currentTier="pro" />
    );

    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Business')).toHaveClass('bg-indigo-100');
  });

  it('should apply custom className', () => {
    render(
      <FeatureBadge requiredTier="pro" currentTier="free" className="custom-badge" />
    );

    const badge = screen.getByText('Pro');
    expect(badge).toHaveClass('custom-badge');
  });
});
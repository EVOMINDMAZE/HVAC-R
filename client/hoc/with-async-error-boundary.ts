import React from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export function withAsyncErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithAsyncErrorBoundary(props: P) {
    return React.createElement(
      ErrorBoundary,
      {
        fallback,
        children: React.createElement(WrappedComponent, props),
      },
    );
  };
}

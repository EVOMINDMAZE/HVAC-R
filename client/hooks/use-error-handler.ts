import React from 'react';

import { useMonitoring } from '@/lib/monitoring';

export function useErrorHandler() {
  const { error } = useMonitoring();

  return React.useCallback((err: Error) => {
    error(err);
  }, [error]);
}
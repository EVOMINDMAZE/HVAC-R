import path from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/scripts/**',
      '**/*.spec.ts',
    ],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      all: false,
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'client/components/ConsentBanner.tsx',
        'client/components/FeatureLock.tsx',
        'client/components/UpgradeModal.tsx',
        'client/components/dashboard/ops-missions-utils.ts',
        'client/components/shared/DataTable.tsx',
        'client/config/monitorRegistry.ts',
        'client/lib/**/*.ts',
        'server/routes/privacy.ts',
        'server/routes/compat/*.ts',
        'shared/types/dtos.ts',
      ],
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 60,
        statements: 60,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/scripts/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});

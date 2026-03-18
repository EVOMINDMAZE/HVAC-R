import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
    {
        ignores: [
            'dist',
            'archive',
            // E2E helpers use Playwright/Node patterns that don't benefit from React linting.
            'e2e',
            // Common generated artifacts.
            'playwright-report',
            'test-results',
            'e2e-results',
            'output',
        ],
    },
    // Base TypeScript configuration for all .ts and .tsx files
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.node,
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-namespace': 'off',
            'import/order': ['warn', {
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
                'newlines-between': 'always',
                pathGroupsExcludedImportTypes: ['builtin'],
            }],
            'import/newline-after-import': 'warn',
        },
    },
    // Client-specific overrides (React + browser globals)
    {
        files: ['client/**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],
            'react-hooks/purity': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/set-state-in-effect': 'off',
            'react-hooks/exhaustive-deps': 'off',
        },
    },
    // Server-specific overrides (Node.js globals - already set in base)
    {
        files: ['server/**/*.ts'],
        // No additional configuration needed beyond base Node globals
    },
    // Shared directory overrides (no additional globals)
    {
        files: ['shared/**/*.ts'],
        // No additional configuration needed
    },
)

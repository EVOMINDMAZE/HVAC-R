import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactrefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

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
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactrefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            // The newer react-hooks plugin includes additional "purity" style rules that
            // produce many false positives in this codebase. Keep the core hook rules
            // while we migrate incrementally.
            'react-hooks/purity': 'off',
            'react-hooks/immutability': 'off',
            'react-hooks/set-state-in-effect': 'off',

            '@typescript-eslint/no-namespace': 'off',
            'react-hooks/exhaustive-deps': 'off',
        },
    },
)

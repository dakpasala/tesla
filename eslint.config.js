import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';

export default [
  {
    // Minimal config: register TypeScript parser and the main plugins so
    // ESLint can parse .ts/.tsx and .jsx files during commits. This avoids
    // complex nested extends resolution in the flat config while you
    // iterate on a full ruleset.
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: { '@typescript-eslint': tsPlugin, react: pluginReact },
    settings: { react: { version: 'detect' } },
    rules: {
      // Keep rules minimal for now; you can re-enable recommended
      // rulesets once the config is stabilized.
      '@typescript-eslint/no-unused-vars': ['warn'],
    },
  },
];

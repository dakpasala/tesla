import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Add TypeScript-specific rules here if needed
      // '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  // Server-specific config
  {
    files: ['packages/server/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly',
      },
    },
  },
  // Test files config
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/jest.setup.js',
    ],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.jest,
        global: 'readonly', // Fix for 'global' is not defined
      },
    },
  },
  // Metro config specifically (if it uses module.exports)
  {
    files: ['**/metro.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  // Other config files that might use ESM
  {
    files: ['**/babel.config.js', '**/jest.config.js', '**/*.config.{js,ts}'],
    languageOptions: {
      sourceType: 'module', // Changed to module
      globals: {
        ...globals.node,
      },
      globals: globals.browser,
    },
    plugins: { '@typescript-eslint': tsPlugin, react: pluginReact },
    settings: { react: { version: 'detect' } },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn'],
      // should probably add more recommended rulesets later
    },
  },
];

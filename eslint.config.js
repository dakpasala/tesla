import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __DEV__: 'readonly',
      },
    },
  },
  // react files
  {
    files: ['packages/mobile/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-native': reactNative,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error', // This fixes the false positives!
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
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
    },
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      '**/coverage/**',
    ],
  },
];

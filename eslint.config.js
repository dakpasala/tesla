import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

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
  // Server-specific config
  {
    files: ['packages/server/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly', // Fix for 'process' is not defined
      },
    },
  },
  // Test files config
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest, // Fix for 'jest' is not defined
      },
    },
  },
  // Config files (metro, babel, jest configs)
  {
    files: [
      '**/metro.config.js',
      '**/babel.config.js',
      '**/jest.config.js',
      '**/*.config.{js,ts}',
    ],
    languageOptions: {
      sourceType: 'commonjs', // Config files often use CommonJS
      globals: {
        ...globals.node,
        module: 'readonly', // Fix for 'module' is not defined
        require: 'readonly', // Fix for 'require' is not defined
        __dirname: 'readonly',
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

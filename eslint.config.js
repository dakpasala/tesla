// eslint.config.js
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
      globals: { __DEV__: 'readonly' },
    },
  },
  {
    files: ['src/apps/server/**/*'],
    languageOptions: {
      sourceType: 'module',
    },
    linterOptions: {
      // Keep RN-specific rules out of server if you later add them
    },
  },
];

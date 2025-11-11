import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.{js,ts}', 'src/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.test.{js,ts}', 'src/**/__tests__/**'],
    },
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
});

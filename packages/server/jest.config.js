export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

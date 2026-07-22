export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/**/*.test.{js,mjs}'],
  collectCoverageFrom: ['src/**/*.mjs'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

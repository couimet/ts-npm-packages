// Registers toThrowDetailedError / toBeDetailedError matchers and their
// TypeScript types. Uses the pre-Jest-30 entry point because this package
// still targets @types/jest@29 (global jest namespace, not @jest/expect).
import '@couimet/detailed-error-testing/setup-before-jest-30';

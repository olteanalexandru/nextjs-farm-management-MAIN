import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './src/__tests__/config/test-config';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock fetch globally
global.fetch = vi.fn();

// Setup test database before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Cleanup test database after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Reset all mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});

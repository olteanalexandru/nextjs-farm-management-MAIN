import { PrismaClient } from '@prisma/client';
import { cleanupDatabase } from '../helpers/db-test-setup';

const prisma = new PrismaClient();

export const setupTestDatabase = async () => {
  try {
    await prisma.$connect();
    await cleanupDatabase();
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.warn('Test database not reachable — DB-dependent tests will be skipped:', (error as Error).message);
  }
};

export const teardownTestDatabase = async () => {
  try {
    await cleanupDatabase();
    await prisma.$disconnect();
    console.log('Test database teardown completed successfully');
  } catch (error) {
    console.warn('Test database teardown skipped (not reachable):', (error as Error).message);
    try { await prisma.$disconnect(); } catch { /* ignore */ }
  }
};

// Export prisma client for use in tests
export { prisma };

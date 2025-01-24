import { PrismaClient } from '@prisma/client';
import { cleanupDatabase } from '../helpers/db-test-setup';

const prisma = new PrismaClient();

export const setupTestDatabase = async () => {
  try {
    // Verify database connection
    await prisma.$connect();

    // Clean any existing test data
    await cleanupDatabase();

    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

export const teardownTestDatabase = async () => {
  try {
    // Clean up test data
    await cleanupDatabase();

    // Disconnect prisma client
    await prisma.$disconnect();

    console.log('Test database teardown completed successfully');
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
};

// Export prisma client for use in tests
export { prisma };

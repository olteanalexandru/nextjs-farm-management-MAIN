import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Test data interfaces
interface TestUser {
  id: string;
  auth0Id: string;
  name: string;
  email: string;
  roleType: string;
}

interface TestCrop {
  id: number;
  cropName: string;
  nitrogenSupply: Decimal;
  nitrogenDemand: Decimal;
}

// Create test data
export const createTestUser = async (overrides = {}): Promise<TestUser> => {
  const defaultUser = {
    id: uuidv4(),
    auth0Id: `auth0|${uuidv4()}`,
    name: 'Test User',
    email: `test-${uuidv4()}@example.com`,
    roleType: 'FARMER',
  };

  const userData = { ...defaultUser, ...overrides };
  return await prisma.user.create({ data: userData });
};

export const createTestCrop = async (userId: string, overrides = {}): Promise<TestCrop> => {
  const defaultCrop = {
    cropName: 'Test Crop',
    nitrogenSupply: new Decimal(50.00),
    nitrogenDemand: new Decimal(100.00),
    userId,
  };

  const cropData = { ...defaultCrop, ...overrides };
  return await prisma.crop.create({ data: cropData });
};

export const createTestFertilizationPlan = async (userId: string, cropId: number, overrides = {}) => {
  const defaultPlan = {
    userId,
    cropId,
    plannedDate: new Date(),
    fertilizer: 'Test Fertilizer',
    applicationRate: new Decimal(100.00),
    nitrogenContent: new Decimal(30.00),
    applicationMethod: 'broadcast',
  };

  const planData = { ...defaultPlan, ...overrides };
  return await prisma.fertilizationPlan.create({ data: planData });
};

export const createTestPost = async (userId: string, overrides = {}) => {
  const defaultPost = {
    userId,
    title: 'Test Post',
    brief: 'Test Brief',
    description: 'Test Description',
    published: false,
  };

  const postData = { ...defaultPost, ...overrides };
  return await prisma.post.create({ data: postData });
};

export const createTestRotation = async (userId: string, overrides = {}) => {
  const defaultRotation = {
    userId,
    rotationName: 'Test Rotation',
    fieldSize: new Decimal(100.00),
    numberOfDivisions: 4,
  };

  const rotationData = { ...defaultRotation, ...overrides };
  return await prisma.rotation.create({ data: rotationData });
};

// Cleanup function
export const cleanupDatabase = async () => {
  const tablesToClean = [
    'fertilization_plans',
    'rotation_plans',
    'user_crop_selections',
    'soil_tests',
    'crop_details',
    'rotations',
    'posts',
    'crops',
    'users'
  ];

  try {
    for (const table of tablesToClean) {
      await prisma.$executeRawUnsafe(`DELETE FROM [${table}]`);
    }
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};

// Initialize test database
export const initializeTestDatabase = async () => {
  await cleanupDatabase();
};

// Export prisma instance for direct use in tests if needed
export { prisma };

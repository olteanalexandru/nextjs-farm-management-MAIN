
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || 
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Add connection pooling settings
    connection: {
      pool: {
        min: 1,
        max: 10
      }
    }
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

// Add connection test function
export async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to Azure SQL Database');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT @@VERSION as version`;
    console.log('Database version:', result);
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

// Add graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
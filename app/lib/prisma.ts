import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

// Warmup function to establish initial connection
export const warmupDatabase = async () => {
  try {
    await prisma.$connect()
    console.log('Database connection established successfully')
    
    // Perform a simple query to test the connection
    await prisma.$queryRaw`SELECT 1`
    
  } catch (error) {
    console.error('Initial database connection failed:', error)
    let retries = 5
    
    while (retries > 0) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000))
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        console.log('Database connection established after retry')
        break
      } catch (retryError) {
        retries--
        console.error(`Connection retry failed, ${retries} attempts remaining`)
        
        if (retries === 0) {
          console.error('Failed to connect to database after all retries')
          throw retryError
        }
      }
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export { prisma }

import { dbService, prisma } from './database-service'

export const warmupDatabase = async () => {
  await dbService.connect()
}

export { prisma }

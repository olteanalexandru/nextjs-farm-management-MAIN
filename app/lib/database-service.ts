import { PrismaClient } from '@prisma/client'

class DatabaseService {
  private static instance: DatabaseService
  private prisma: PrismaClient
  private isConnected: boolean = false
  private connectionPromise: Promise<void> | null = null

  private constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    })
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected) return

    // If there's already a connection attempt in progress, wait for it
    if (this.connectionPromise) {
      await this.connectionPromise
      return
    }

    this.connectionPromise = this.establishConnection()
    await this.connectionPromise
    this.connectionPromise = null
  }

  private async establishConnection(): Promise<void> {
    try {
      await this.prisma.$connect()
      await this.prisma.$queryRaw`SELECT 1`
      this.isConnected = true
      console.log('Database connection established successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  getPrisma(): PrismaClient {
    return this.prisma
  }

  isConnectedToDatabase(): boolean {
    return this.isConnected
  }
}

export const dbService = DatabaseService.getInstance()
export const prisma = dbService.getPrisma()

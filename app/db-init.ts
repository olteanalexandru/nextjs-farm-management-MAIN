import { warmupDatabase } from './lib/prisma'

export async function initDatabase() {
    try {
        await warmupDatabase()
        return true
    } catch (error) {
        console.error('Database initialization failed:', error)
        return false
    }
}

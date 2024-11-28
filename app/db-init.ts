import { warmupDatabase } from './lib/prisma'

let isWarmedUp = false

export async function initDatabase() {
    if (!isWarmedUp) {
        try {
            await warmupDatabase()
            isWarmedUp = true
            console.log('Database warmup completed successfully')
        } catch (error) {
            console.error('Database warmup failed:', error)
            // Don't set isWarmedUp to true if warmup failed
            throw error
        }
    }
}

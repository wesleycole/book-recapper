import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'

function getDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL
  }

  if (isProduction) {
    throw new Error(
      'TURSO_DATABASE_URL environment variable is required in production. ' +
        'Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your Vercel environment variables.'
    )
  }

  return 'file:local.db'
}

const client = createClient({
  url: getDatabaseUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

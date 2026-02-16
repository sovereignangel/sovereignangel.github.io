// @ts-nocheck
/**
 * Database Client
 * Works with both Supabase and local PostgreSQL
 * Set DATABASE_URL for local Postgres, or SUPABASE_* for Supabase
 */

import { Pool } from 'pg'

// Check if using local PostgreSQL or Supabase
const useLocalDb = !!process.env.DATABASE_URL

let pool: Pool | null = null

/**
 * Get database connection pool
 */
export function getDb() {
  if (useLocalDb) {
    // Local PostgreSQL
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    }
    return pool
  } else {
    // Fallback to Supabase (for development)
    const { createClient } = require('@supabase/supabase-js')
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
}

/**
 * Query helper for PostgreSQL
 */
export async function query(text: string, params?: any[]) {
  if (!useLocalDb) {
    throw new Error('query() is only for local PostgreSQL. Use Supabase client methods.')
  }

  const db = getDb() as Pool
  const result = await db.query(text, params)
  return result
}

/**
 * Insert helper
 */
export async function insert(table: string, data: any) {
  if (!useLocalDb) {
    const db = getDb() as any // Supabase client
    return await db.from(table).insert(data)
  }

  const db = getDb() as Pool
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`
  const result = await db.query(sql, values)
  return { data: result.rows, error: null }
}

/**
 * Update helper
 */
export async function update(table: string, data: any, where: any) {
  if (!useLocalDb) {
    const db = getDb() as any // Supabase client
    return await db.from(table).update(data).match(where)
  }

  const db = getDb() as Pool
  const keys = Object.keys(data)
  const values = Object.values(data)
  const whereKeys = Object.keys(where)
  const whereValues = Object.values(where)

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
  const whereClause = whereKeys.map((key, i) => `${key} = $${keys.length + i + 1}`).join(' AND ')

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`
  const result = await db.query(sql, [...values, ...whereValues])
  return { data: result.rows, error: null }
}

/**
 * Upsert helper (PostgreSQL UPSERT)
 */
export async function upsert(table: string, data: any, conflictColumns: string[]) {
  if (!useLocalDb) {
    const db = getDb() as any // Supabase client
    return await db.from(table).upsert(data)
  }

  const db = getDb() as Pool
  const keys = Object.keys(data)
  const values = Object.values(data)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')

  const updateClause = keys
    .filter(k => !conflictColumns.includes(k))
    .map(k => `${k} = EXCLUDED.${k}`)
    .join(', ')

  const sql = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumns.join(', ')})
    DO UPDATE SET ${updateClause}
    RETURNING *
  `

  const result = await db.query(sql, values)
  return { data: result.rows, error: null }
}

/**
 * Select helper
 */
export async function select(table: string, options: {
  where?: any
  orderBy?: { column: string, ascending?: boolean }
  limit?: number
  offset?: number
} = {}) {
  if (!useLocalDb) {
    const db = getDb() as any // Supabase client
    let query = db.from(table).select('*')

    if (options.where) {
      query = query.match(options.where)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }

    return await query
  }

  const db = getDb() as Pool
  let sql = `SELECT * FROM ${table}`
  const params: any[] = []
  let paramCount = 0

  if (options.where) {
    const whereKeys = Object.keys(options.where)
    const whereClause = whereKeys.map((key) => {
      paramCount++
      params.push(options.where![key])
      return `${key} = $${paramCount}`
    }).join(' AND ')
    sql += ` WHERE ${whereClause}`
  }

  if (options.orderBy) {
    sql += ` ORDER BY ${options.orderBy.column} ${options.orderBy.ascending !== false ? 'ASC' : 'DESC'}`
  }

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`
  }

  if (options.offset) {
    sql += ` OFFSET ${options.offset}`
  }

  const result = await db.query(sql, params)
  return { data: result.rows, error: null }
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

import { neon } from '@neondatabase/serverless'

// Returns null when DATABASE_URL is not configured (local dev without Neon).
const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null

export default sql

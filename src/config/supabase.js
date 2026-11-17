import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Parse DATE (OID 1082) as string 'YYYY-MM-DD' directly to prevent UTC timezone shift
types.setTypeParser(1082, (val) => val);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

if (!supabaseUrl) {
  console.warn('⚠️ Warning: SUPABASE_URL environment variable is not defined.');
}

/**
 * Supabase JavaScript Client instance
 */
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * PostgreSQL Direct Connection Pool (via Supabase Pooler)
 * Used for strict transactional execution, row-level locks (FOR UPDATE),
 * and native PostgreSQL stored procedures (RPCs).
 */
export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test connection on startup
dbPool.query('SELECT NOW() AS connected_at;')
  .then((res) => {
    console.log(`✅ Supabase PostgreSQL Pool connected successfully at: ${res.rows[0].connected_at}`);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to Supabase PostgreSQL Pool:', err.message);
  });

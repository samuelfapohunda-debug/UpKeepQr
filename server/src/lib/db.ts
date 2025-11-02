import { Pool } from 'pg';
import { config } from '../config.js';

let pool: Pool | null = null;

export function getDB() {
  if (!pool) {
    if (config.databaseUrl) {
      pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    } else if (config.pgHost) {
      pool = new Pool({
        host: config.pgHost,
        port: config.pgPort,
        database: config.pgDatabase,
        user: config.pgUser,
        password: config.pgPassword,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
    } else {
      throw new Error('No database configuration found');
    }
  }
  
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const db = getDB();
  const result = await db.query(text, params);
  return result;
}

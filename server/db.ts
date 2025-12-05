import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const databaseUrl = process.env.DATABASE_URL;

function isNeonDatabase(url: string): boolean {
  return url.includes('neon.tech') || url.includes('neon-') || url.includes('helium');
}

let db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;
let pool: NeonPool | PgPool;

if (isNeonDatabase(databaseUrl)) {
  console.log('🔌 Using Neon serverless driver (WebSocket)');
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon(pool as NeonPool, { schema });
} else {
  console.log('🔌 Using standard PostgreSQL driver');
  pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });
  db = drizzlePg(pool as PgPool, { schema });
}

export { pool, db };

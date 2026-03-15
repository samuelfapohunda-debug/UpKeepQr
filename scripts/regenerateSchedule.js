import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Find Samuel's household
  const result = await pool.query(
    "SELECT id, email FROM households WHERE email LIKE '%samuel%' OR email LIKE '%fapohunda%' ORDER BY created_at DESC LIMIT 3"
  );
  console.log('Households found:', JSON.stringify(result.rows, null, 2));
  await pool.end();
}

main().catch(console.error);

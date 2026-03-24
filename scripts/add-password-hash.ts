import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Running password auth migration...');

    await client.query(`
      ALTER TABLE households ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);
    console.log('✅ password_hash column added');

    await client.query(`
      ALTER TABLE households ADD COLUMN IF NOT EXISTS reset_token TEXT;
    `);
    console.log('✅ reset_token column added');

    await client.query(`
      ALTER TABLE households ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
    `);
    console.log('✅ reset_token_expires column added');

    // Verify columns exist
    const { rows } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'households'
        AND column_name IN ('password_hash', 'reset_token', 'reset_token_expires')
      ORDER BY column_name;
    `);
    console.log('\nVerification — columns in households table:');
    rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    console.log('\n✅ Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const tables = [
  {
    name: 'push_subscriptions',
    sql: `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id           SERIAL PRIMARY KEY,
        household_id VARCHAR(255) NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        endpoint     TEXT NOT NULL,
        p256dh       TEXT NOT NULL,
        auth         TEXT NOT NULL,
        user_agent   VARCHAR(500),
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint
        ON push_subscriptions (endpoint);
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_household
        ON push_subscriptions (household_id);
    `,
  },
  {
    name: 'alerts_sent',
    sql: `
      CREATE TABLE IF NOT EXISTS alerts_sent (
        id           SERIAL PRIMARY KEY,
        household_id VARCHAR(255) NOT NULL,
        alert_title  VARCHAR(255) NOT NULL,
        alert_body   TEXT,
        urgency      VARCHAR(20),
        category     VARCHAR(100),
        was_delivered BOOLEAN NOT NULL DEFAULT FALSE,
        delivered_at  TIMESTAMP,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_alerts_sent_household
        ON alerts_sent (household_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_sent_created
        ON alerts_sent (created_at);
    `,
  },
];

async function main() {
  const client = await pool.connect();
  try {
    for (const table of tables) {
      process.stdout.write(`Creating ${table.name}... `);
      await client.query(table.sql);
      console.log('done');
    }

    // Verify
    const result = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('push_subscriptions', 'alerts_sent')
      ORDER BY tablename
    `);
    console.log('\nVerified tables:', result.rows.map(r => r.tablename).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

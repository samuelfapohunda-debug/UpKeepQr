import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function diagnose() {
  console.log('\n=== AI Generation Logs ===');
  const logs = await pool.query('SELECT id, household_id, model, success, error_message, tokens_used, created_at FROM ai_generation_logs ORDER BY created_at DESC LIMIT 5');
  console.log(JSON.stringify(logs.rows, null, 2));

  console.log('\n=== Maintenance Tasks by Household ===');
  const tasks = await pool.query('SELECT household_id, count(*) as count FROM maintenance_tasks GROUP BY household_id');
  console.log(JSON.stringify(tasks.rows, null, 2));

  console.log('\n=== Home Profiles ===');
  const profiles = await pool.query('SELECT id, household_id, city, state, home_type, schedule_generated_at FROM home_profiles ORDER BY created_at DESC LIMIT 5');
  console.log(JSON.stringify(profiles.rows, null, 2));

  console.log('\n=== Recent Households ===');
  const households = await pool.query("SELECT id, email, name FROM households ORDER BY created_at DESC LIMIT 5");
  console.log(JSON.stringify(households.rows, null, 2));

  await pool.end();
}

diagnose().catch(console.error);

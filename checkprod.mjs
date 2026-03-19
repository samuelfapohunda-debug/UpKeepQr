import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.PROD_DB,
  ssl: { rejectUnauthorized: false }
});
const r = await pool.query('SELECT id, property_name, activation_status, schedule_generated FROM managed_properties ORDER BY created_at DESC LIMIT 5');
console.log(JSON.stringify(r.rows, null, 2));
await pool.end();

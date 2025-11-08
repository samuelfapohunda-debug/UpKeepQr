import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkLeads() {
  try {
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'leads';
    `);

    console.log('✅ Leads table exists:', result.rows);

    const count = await db.execute(sql`SELECT COUNT(*) as count FROM leads;`);
    console.log('📊 Current leads count:', count.rows[0].count);

  } catch (error: unknown) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkLeads();

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkLeads() {
  try {
    console.log('📊 Recent Leads:\n');

    const leads = await db.execute(sql`
      SELECT 
        id,
        full_name,
        email,
        phone,
        city,
        state,
        interest_type,
        budget_range,
        timeline_to_proceed,
        created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (leads.rows.length === 0) {
      console.log('No leads captured yet.');
    } else {
      console.table(leads.rows);
      console.log(`\n✅ Total leads shown: ${leads.rows.length}`);
    }
  } catch (error: unknown) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkLeads();

import { db } from '../db.js';
import { sql } from 'drizzle-orm';

/**
 * Creates the order_id_counter sequence for generating unique order IDs
 * This sequence is used by the orderIdGenerator utility to create IDs in format: {counter}-{year}
 */
async function createOrderIdCounterSequence() {
  try {
    console.log('📊 Creating order_id_counter sequence...');
    
    // Create the sequence if it doesn't exist
    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS order_id_counter START WITH 1 INCREMENT BY 1;
    `);
    
    console.log('✅ order_id_counter sequence created successfully!');
    
    // Verify the sequence exists
    const result = await db.execute(sql`
      SELECT sequencename 
      FROM pg_sequences 
      WHERE sequencename = 'order_id_counter';
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Sequence verified:', result.rows[0]);
    } else {
      throw new Error('Sequence creation verification failed');
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

export { createOrderIdCounterSequence };

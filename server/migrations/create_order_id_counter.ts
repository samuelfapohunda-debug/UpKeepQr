import { db } from '../db.js';
import { sql } from 'drizzle-orm';

/**
 * Creates the order_id_counter sequence for generating unique order IDs
 * This sequence is used by the orderIdGenerator utility to create IDs in format: {counter}-{year}
 * 
 * CRITICAL: This also syncs the sequence with existing order data to prevent duplicate key errors
 */
async function createOrderIdCounterSequence() {
  try {
    console.log('[OrderIdSequence] Creating/verifying order_id_counter sequence...');
    
    // Create the sequence if it doesn't exist
    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS order_id_counter START WITH 1 INCREMENT BY 1;
    `);
    
    console.log('[OrderIdSequence] Sequence exists, syncing with existing orders...');
    
    // Find the maximum counter value from existing orders
    // Order IDs are in format: {counter}-{year} (e.g., "5-2025")
    // First, let's see what order_ids exist for debugging
    const debugResult = await db.execute(sql`
      SELECT order_id FROM order_magnet_orders WHERE order_id IS NOT NULL LIMIT 10
    `);
    console.log('[OrderIdSequence] Sample existing order_ids:', debugResult.rows);
    
    // Use a simpler pattern match that works better with PostgreSQL
    const maxResult = await db.execute(sql`
      SELECT COALESCE(
        MAX(
          CASE 
            WHEN order_id ~ '^[0-9]+-[0-9]{4}$' 
            THEN CAST(SPLIT_PART(order_id, '-', 1) AS BIGINT)
            ELSE 0
          END
        ),
        0
      ) as max_counter
      FROM order_magnet_orders 
      WHERE order_id IS NOT NULL
    `);
    
    const maxCounter = Number((maxResult.rows[0] as any)?.max_counter || 0);
    console.log('[OrderIdSequence] Max existing counter:', maxCounter);
    
    // Set the sequence to start AFTER the max existing value
    // Using setval with false means next nextval() returns maxCounter + 1
    if (maxCounter > 0) {
      await db.execute(sql`
        SELECT setval('order_id_counter', ${maxCounter}, true)
      `);
      console.log(`[OrderIdSequence] Sequence set to ${maxCounter}, next ID will be ${maxCounter + 1}`);
    }
    
    // Verify the sequence exists and get current value
    const verifyResult = await db.execute(sql`
      SELECT last_value, is_called FROM order_id_counter;
    `);
    
    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0] as any;
      console.log('[OrderIdSequence] Sequence verified:', { 
        lastValue: row.last_value, 
        isCalled: row.is_called 
      });
    }
    
    console.log('[OrderIdSequence] Setup complete!');
    
  } catch (error: any) {
    console.error('[OrderIdSequence] Migration failed:', error.message);
    throw error;
  }
}

export { createOrderIdCounterSequence };

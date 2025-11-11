import { pool } from "../db";

/**
 * Generates a new Order ID in format: {counter}-{year}
 * Example: 1-2025, 2-2025, 150-2025
 * 
 * This implementation uses PostgreSQL sequence for atomic counter generation
 * Ensures zero race conditions even under high concurrency
 * 
 * @returns Promise<string> - The generated order ID
 * @throws Error if Order ID generation fails or format is invalid
 */
export async function generateOrderId(): Promise<string> {
  try {
    // Get the current year (4 digits)
    const currentYear = new Date().getFullYear();
    
    // Get next counter value from sequence (atomic operation)
    const result = await pool.query(`
      SELECT nextval('order_id_counter') as counter
    `);
    
    const counter = result.rows[0].counter;
    
    // Format: {counter}-{year}
    const orderId = `${counter}-${currentYear}`;
    
    // Validate format before returning (safety check)
    if (!/^\d{1,10}-\d{4}$/.test(orderId)) {
      console.error('[generateOrderId] Invalid Order ID format generated', { orderId, counter, currentYear });
      throw new Error(`Invalid Order ID format generated: ${orderId}`);
    }
    
    console.log('[generateOrderId] Order ID generated successfully', { orderId });
    return orderId;
    
  } catch (error: any) {
    console.error('[generateOrderId] Order ID generation failed', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Throw error and reject order creation
    throw new Error(`Order ID generation failed: ${error.message}`);
  }
}

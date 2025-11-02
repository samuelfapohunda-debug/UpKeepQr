// CORRECTED STORAGE FUNCTIONS - Use these if the automatic fix fails

import { db } from "./db";

// Corrected function - uses homeId (number) instead of householdId (string)
export async function getHomeProfileExtra(homeId: number): Promise<unknown> {
  try {
    const result = await db.query(
      `SELECT * FROM home_profile_extra WHERE home_id = $1`,
      [homeId]
    );
    return result.rows[0] || {};
  } catch (error) {
    console.error('Error getting home profile extra:', error);
    return {};
  }
}

// Corrected function - uses homeId (number) instead of householdId (string)  
export async function updateHomeProfileExtra(homeId: number, data: Record<string, unknown>): Promise<unknown> {
  try {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    if (fields.length === 0) {
      return await getHomeProfileExtra(homeId);
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `
      INSERT INTO home_profile_extra (home_id, ${fields.join(', ')}, updated_at)
      VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')}, CURRENT_TIMESTAMP)
      ON CONFLICT (home_id) 
      DO UPDATE SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [homeId, ...values]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating home profile extra:', error);
    throw error;
  }
}

// Keep this function as is - it correctly uses homeId
export async function getHomeIdByToken(token: string): Promise<number | null> {
  try {
    const result = await db.query(
      `SELECT id FROM homes WHERE setup_token = $1`,
      [token]
    );
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Error getting homeId by token:', error);
    return null;
  }
}

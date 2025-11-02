import { db } from "../db";
import { HomeProfileExtra } from "../models/homeProfileExtra";

export class HomeProfileExtraStorage {
  async upsert(homeId: number, data: HomeProfileExtra): Promise<HomeProfileExtra> {
    const fields = Object.keys(data).filter(k => data[k as keyof HomeProfileExtra] !== undefined);
    
    if (fields.length === 0) {
      throw new Error("No data to update");
    }

    const values = fields.map(k => data[k as keyof HomeProfileExtra]);
    const setClause = fields.map((f, i) => `${this.toSnakeCase(f)} = $${i + 2}`).join(", ");
    const insertCols = fields.map(this.toSnakeCase).join(", ");
    const insertVals = fields.map((_, i) => `$${i + 2}`).join(", ");
    
    const query = `
      INSERT INTO home_profile_extra (home_id, ${insertCols})
      VALUES ($1, ${insertVals})
      ON CONFLICT (home_id) DO UPDATE SET ${setClause}
      RETURNING *
    `;
    
    const result = await db.query(query, [homeId, ...values]);
    return this.toCamelCase(result.rows[0]);
  }

  async get(homeId: number): Promise<HomeProfileExtra | null> {
    const result = await db.query(
      "SELECT * FROM home_profile_extra WHERE home_id = $1",
      [homeId]
    );
    return result.rows[0] ? this.toCamelCase(result.rows[0]) : null;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
    const camelObj: Record<string, unknown> = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelObj[camelKey] = obj[key];
    }
    return camelObj;
  }
}

export const homeProfileExtraStorage = new HomeProfileExtraStorage();

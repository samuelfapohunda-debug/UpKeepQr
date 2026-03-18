import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export async function createPortfolioTables() {
  try {
    console.log('[Portfolio Migration] Creating managed_properties table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS managed_properties (
        id                     VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_household_id VARCHAR NOT NULL REFERENCES households(id),
        property_name          VARCHAR(255) NOT NULL,
        address                VARCHAR(255) NOT NULL,
        city                   VARCHAR(100) NOT NULL,
        state                  VARCHAR(50)  NOT NULL,
        zip                    VARCHAR(20)  NOT NULL,
        unit_number            VARCHAR(50),
        property_type          VARCHAR(50)  NOT NULL DEFAULT 'single_family',
        year_built             INTEGER,
        square_footage         INTEGER,
        hvac_type              VARCHAR(50),
        qr_code_id             VARCHAR,
        activation_status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
        home_profile_id        VARCHAR,
        schedule_generated     BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_managed_properties_portfolio
        ON managed_properties (portfolio_household_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_managed_properties_status
        ON managed_properties (activation_status)
    `);
    console.log('[Portfolio Migration] managed_properties ready');

    console.log('[Portfolio Migration] Creating bulk_upload_jobs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
        id                     SERIAL PRIMARY KEY,
        portfolio_household_id VARCHAR NOT NULL,
        total_properties       INTEGER NOT NULL,
        processed              INTEGER NOT NULL DEFAULT 0,
        successful             INTEGER NOT NULL DEFAULT 0,
        failed                 INTEGER NOT NULL DEFAULT 0,
        status                 VARCHAR(20) NOT NULL DEFAULT 'pending',
        error_log              TEXT,
        created_at             TIMESTAMP   NOT NULL DEFAULT NOW(),
        completed_at           TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_portfolio
        ON bulk_upload_jobs (portfolio_household_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_status
        ON bulk_upload_jobs (status)
    `);
    console.log('[Portfolio Migration] bulk_upload_jobs ready');

    console.log('[Portfolio Migration] Complete');
  } catch (error: any) {
    console.error('[Portfolio Migration] Failed:', error.message);
    throw error;
  }
}

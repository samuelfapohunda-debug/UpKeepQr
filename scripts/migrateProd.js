import pg from 'pg';
import { config } from 'dotenv';
config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const tables = [
  {
    name: 'home_profiles',
    sql: `
      CREATE TABLE IF NOT EXISTS home_profiles (
        id                    SERIAL PRIMARY KEY,
        household_id          VARCHAR(255) NOT NULL,
        address               VARCHAR(255),
        city                  VARCHAR(100),
        state                 VARCHAR(50),
        zip                   VARCHAR(10),
        year_built            INTEGER,
        square_footage        INTEGER,
        home_type             VARCHAR(50),
        roof_type             VARCHAR(50),
        hvac_type             VARCHAR(50),
        climate_zone          VARCHAR(100),
        climate_zone_source   VARCHAR(50) DEFAULT 'state_heuristic',
        appliances            JSON DEFAULT '[]',
        schedule_generated_at TIMESTAMP,
        created_at            TIMESTAMP DEFAULT NOW(),
        updated_at            TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'maintenance_task_templates',
    sql: `
      CREATE TABLE IF NOT EXISTS maintenance_task_templates (
        id               SERIAL PRIMARY KEY,
        title            VARCHAR(255) NOT NULL,
        category         VARCHAR(100) NOT NULL,
        frequency        VARCHAR(50)  NOT NULL,
        typical_cost_min INTEGER,
        typical_cost_max INTEGER,
        applies_to       VARCHAR(100),
        climate_zones    JSON DEFAULT '[]',
        min_home_age     INTEGER,
        max_home_age     INTEGER,
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'maintenance_tasks',
    sql: `
      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id                  SERIAL PRIMARY KEY,
        household_id        VARCHAR(255) NOT NULL,
        home_profile_id     INTEGER,
        title               VARCHAR(255) NOT NULL,
        description         TEXT,
        month               INTEGER NOT NULL,
        frequency           VARCHAR(50)  NOT NULL,
        category            VARCHAR(100) NOT NULL,
        priority            VARCHAR(20)  NOT NULL DEFAULT 'medium',
        estimated_cost_min  INTEGER,
        estimated_cost_max  INTEGER,
        estimated_diy_cost  INTEGER,
        estimated_pro_cost  INTEGER,
        is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at        TIMESTAMP,
        due_date            TIMESTAMP,
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      );
    `
  },
  {
    name: 'ai_generation_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_generation_logs (
        id              SERIAL PRIMARY KEY,
        household_id    VARCHAR(255) NOT NULL,
        home_profile_id INTEGER,
        model           VARCHAR(100) NOT NULL,
        prompt          TEXT NOT NULL,
        response        TEXT,
        tokens_used     INTEGER,
        success         BOOLEAN NOT NULL DEFAULT FALSE,
        error_message   TEXT,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `
  }
];

const seedSql = `
  INSERT INTO maintenance_task_templates
    (title, category, frequency, typical_cost_min, typical_cost_max, applies_to, climate_zones, min_home_age, max_home_age)
  VALUES
    -- HVAC
    ('Replace HVAC Air Filter',        'hvac',       'quarterly', 10,  30,  'hvac',       '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Annual HVAC Tune-Up',            'hvac',       'annual',    80,  150, 'hvac',       '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Clean AC Condensate Drain Line', 'hvac',       'annual',    0,   50,  'hvac',       '["Hot/Humid","Mixed/Humid"]',                             NULL, NULL),
    ('Inspect and Seal Ductwork',      'hvac',       'biannual',  100, 500, 'hvac',       '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 10,   NULL),
    -- PLUMBING
    ('Flush Water Heater',             'plumbing',   'annual',    0,   50,  'plumbing',   '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Check for Plumbing Leaks',       'plumbing',   'biannual',  0,   100, 'plumbing',   '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Plumbing System Inspection',     'plumbing',   'annual',    150, 350, 'plumbing',   '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 30,   NULL),
    ('Insulate Exposed Pipes',         'plumbing',   'annual',    20,  100, 'plumbing',   '["Cold","Mixed/Humid"]',                                 NULL, NULL),
    -- ELECTRICAL
    ('Test Smoke and CO Detectors',    'electrical', 'biannual',  0,   20,  'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Inspect GFCI Outlets',           'electrical', 'annual',    0,   50,  'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Electrical Panel Inspection',    'electrical', 'annual',    100, 300, 'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 30,   NULL),
    -- EXTERIOR
    ('Clean Gutters',                                    'exterior', 'biannual', 100, 250, 'roof',     '["Cold","Mixed/Humid","Marine"]',                                NULL, NULL),
    ('Inspect and Caulk Windows and Doors',              'exterior', 'annual',   20,  100, 'exterior', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]',        NULL, NULL),
    ('Power Wash Exterior Siding',                       'exterior', 'annual',   150, 400, 'exterior', '["Hot/Humid","Mixed/Humid","Marine"]',                           NULL, NULL),
    ('Inspect Roof for Damage',                          'exterior', 'annual',   100, 300, 'roof',     '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]',        NULL, NULL),
    ('Check and Repair Driveway/Walkway Cracks',         'exterior', 'annual',   50,  300, 'exterior', '["Cold","Mixed/Humid","Mixed/Dry"]',                             NULL, NULL),
    ('Trim Trees and Shrubs Away from House',            'exterior', 'annual',   100, 500, 'exterior', '["Hot/Humid","Mixed/Humid","Cold","Marine"]',                    NULL, NULL),
    -- INTERIOR
    ('Deep Clean Kitchen Appliances',    'interior', 'biannual', 0,   50,  'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Check Attic for Moisture and Pests','interior', 'annual',   0,   200, 'interior',  '["Hot/Humid","Mixed/Humid","Cold","Marine"]',             NULL, NULL),
    ('Inspect Foundation for Cracks',    'interior', 'annual',   0,   300, 'interior',  '["Cold","Mixed/Humid","Mixed/Dry"]',                      NULL, NULL),
    -- APPLIANCES
    ('Clean Refrigerator Coils',          'appliances', 'biannual', 0,  30,  'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Clean Dryer Vent',                  'appliances', 'annual',   70, 150, 'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    ('Inspect Washing Machine Hoses',     'appliances', 'annual',   0,  60,  'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
    -- SEASONAL
    ('Winterize Irrigation System',       'seasonal', 'annual', 50,  150, 'plumbing', '["Cold","Mixed/Humid","Mixed/Dry"]', NULL, NULL),
    ('Prepare Home for Hurricane Season', 'seasonal', 'annual', 100, 500, 'exterior', '["Hot/Humid"]',                     NULL, NULL)
  ON CONFLICT DO NOTHING;
`;

async function main() {
  const client = await pool.connect();
  try {
    // Create tables
    for (const table of tables) {
      process.stdout.write(`Creating table ${table.name}... `);
      await client.query(table.sql);
      console.log('done');
    }

    // Seed templates (idempotent via ON CONFLICT DO NOTHING)
    process.stdout.write('Seeding maintenance_task_templates (25 rows)... ');
    await client.query(seedSql);
    const { rows: [{ count }] } = await client.query('SELECT count(*) FROM maintenance_task_templates');
    console.log(`done (${count} total rows)`);

    // Find Samuel's household
    console.log('\n=== Samuel\'s households ===');
    const result = await client.query(
      `SELECT id, email, setup_status, created_at
       FROM households
       WHERE email LIKE '%samuel%' OR email LIKE '%fapohunda%'
       ORDER BY created_at DESC
       LIMIT 5`
    );
    console.log(JSON.stringify(result.rows, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

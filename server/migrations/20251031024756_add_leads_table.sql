-- Lead Capture Table Migration
-- Run with: psql $DATABASE_URL -f server/migrations/*_add_leads_table.sql

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  
  -- Basic Identification
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_contact TEXT,
  hear_about_us TEXT,
  
  -- Address & Location
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT,
  number_of_locations INTEGER,
  location_nickname TEXT,
  
  -- Property & Asset Information
  home_type TEXT,
  square_footage INTEGER,
  roof_age INTEGER,
  hvac_system_type TEXT,
  water_heater_type TEXT,
  number_of_assets INTEGER,
  asset_categories TEXT,
  
  -- Business/Agent Details
  company_name TEXT,
  industry_type TEXT,
  number_of_employees INTEGER,
  business_website TEXT,
  preferred_service_type TEXT,
  estimated_qr_labels TEXT,
  
  -- Lead Capture Specific (Residential)
  interest_type TEXT,
  need_consultation BOOLEAN,
  is_owner BOOLEAN,
  budget_range TEXT,
  timeline_to_proceed TEXT,
  preferred_contact_time TEXT,
  notes TEXT,
  
  -- Metadata
  activation_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_activation_code ON leads(activation_code);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_interest_type ON leads(interest_type);

-- Add comment
COMMENT ON TABLE leads IS 'Lead capture information from UpKeepQR magnet activation flow';

-- Migration: Add home_profile_extra table
CREATE TABLE IF NOT EXISTS home_profile_extra (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL UNIQUE REFERENCES homes(id) ON DELETE CASCADE,
  
  -- Homeowner Info
  owner_type VARCHAR(20) CHECK (owner_type IN ('owner', 'landlord', 'pm', 'flipper')),
  sell_window VARCHAR(10) CHECK (sell_window IN ('none', 'lt12', '12to24', 'gt24')),
  year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE)),
  
  -- Roof (extended from basic roof_age_years)
  roof_material VARCHAR(20) CHECK (roof_material IN ('asphalt', 'metal', 'tile', 'slate', 'wood', 'other')),
  roof_last_inspection DATE,
  roof_warranty_until DATE,
  
  -- HVAC (extended)
  hvac_brand VARCHAR(50),
  hvac_model VARCHAR(50),
  hvac_age_years INTEGER CHECK (hvac_age_years >= 0 AND hvac_age_years <= 50),
  hvac_last_service_date DATE,
  hvac_service_provider VARCHAR(100),
  hvac_filter_size VARCHAR(20),
  
  -- Water Heater (extended)
  water_heater_brand VARCHAR(50),
  water_heater_age_years INTEGER CHECK (water_heater_age_years >= 0 AND water_heater_age_years <= 50),
  water_heater_capacity_gal INTEGER,
  water_heater_last_flush DATE,
  
  -- Property Details
  exterior_type VARCHAR(20) CHECK (exterior_type IN ('siding', 'brick', 'stucco', 'stone', 'wood', 'other')),
  lot_sq_ft INTEGER,
  stories SMALLINT CHECK (stories >= 1 AND stories <= 10),
  bedrooms SMALLINT,
  bathrooms NUMERIC(3,1),
  garage_size SMALLINT CHECK (garage_size >= 0 AND garage_size <= 10),
  
  -- Utilities & Services
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(50),
  insurance_renewal_date DATE,
  electric_provider VARCHAR(100),
  electric_account_number VARCHAR(50),
  gas_provider VARCHAR(100),
  gas_account_number VARCHAR(50),
  water_provider VARCHAR(100),
  internet_provider VARCHAR(100),
  
  -- HOA
  has_hoa BOOLEAN DEFAULT FALSE,
  hoa_name VARCHAR(100),
  hoa_fee_monthly NUMERIC(10,2),
  hoa_contact_email VARCHAR(100),
  hoa_contact_phone VARCHAR(20),
  
  -- Home Improvement
  planned_projects TEXT[],
  recent_renovations JSONB,
  smart_home_devices TEXT[],
  security_system VARCHAR(50),
  
  -- Financial
  budget_annual_maintenance NUMERIC(10,2),
  budget_emergency_fund NUMERIC(10,2),
  
  -- Communication Preferences
  contact_pref_channel VARCHAR(10) CHECK (contact_pref_channel IN ('email', 'sms', 'both')),
  contact_pref_time VARCHAR(20) CHECK (contact_pref_time IN ('morning', 'afternoon', 'evening', 'anytime')),
  reminder_frequency VARCHAR(20) CHECK (reminder_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'urgent_only')),
  marketing_consent BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  
  -- Equipment
  appliances JSONB,
  
  -- Notes
  special_considerations TEXT,
  contractor_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_home_profile_extra_home_id ON home_profile_extra(home_id);
CREATE INDEX idx_home_profile_extra_owner_type ON home_profile_extra(owner_type);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_home_profile_extra_updated_at 
  BEFORE UPDATE ON home_profile_extra 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

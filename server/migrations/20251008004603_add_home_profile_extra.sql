-- Migration: Add home_profile_extra table
CREATE TABLE IF NOT EXISTS home_profile_extra (
  id SERIAL PRIMARY KEY,
  home_id INTEGER NOT NULL UNIQUE REFERENCES homes(id) ON DELETE CASCADE,
  owner_type VARCHAR(20) CHECK (owner_type IN ('owner', 'landlord', 'pm', 'flipper')),
  year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE)),
  hvac_brand VARCHAR(50),
  hvac_age_years INTEGER CHECK (hvac_age_years >= 0 AND hvac_age_years <= 50),
  water_heater_brand VARCHAR(50),
  insurance_provider VARCHAR(100),
  has_hoa BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_home_profile_extra_home_id ON home_profile_extra(home_id);

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

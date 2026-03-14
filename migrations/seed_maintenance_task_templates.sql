-- Seed maintenance_task_templates with 25 common home maintenance tasks
INSERT INTO maintenance_task_templates (title, category, frequency, typical_cost_min, typical_cost_max, applies_to, climate_zones, min_home_age, max_home_age)
VALUES
  -- HVAC
  ('Replace HVAC Air Filter', 'hvac', 'quarterly', 10, 30, 'hvac', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Annual HVAC Tune-Up', 'hvac', 'annual', 80, 150, 'hvac', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Clean AC Condensate Drain Line', 'hvac', 'annual', 0, 50, 'hvac', '["Hot/Humid","Mixed/Humid"]', NULL, NULL),
  ('Inspect and Seal Ductwork', 'hvac', 'biannual', 100, 500, 'hvac', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 10, NULL),

  -- PLUMBING
  ('Flush Water Heater', 'plumbing', 'annual', 0, 50, 'plumbing', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Check for Plumbing Leaks', 'plumbing', 'biannual', 0, 100, 'plumbing', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Plumbing System Inspection', 'plumbing', 'annual', 150, 350, 'plumbing', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 30, NULL),
  ('Insulate Exposed Pipes', 'plumbing', 'annual', 20, 100, 'plumbing', '["Cold","Mixed/Humid"]', NULL, NULL),

  -- ELECTRICAL
  ('Test Smoke and CO Detectors', 'electrical', 'biannual', 0, 20, 'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Inspect GFCI Outlets', 'electrical', 'annual', 0, 50, 'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Electrical Panel Inspection', 'electrical', 'annual', 100, 300, 'electrical', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', 30, NULL),

  -- EXTERIOR
  ('Clean Gutters', 'exterior', 'biannual', 100, 250, 'roof', '["Cold","Mixed/Humid","Marine"]', NULL, NULL),
  ('Inspect and Caulk Windows and Doors', 'exterior', 'annual', 20, 100, 'exterior', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Power Wash Exterior Siding', 'exterior', 'annual', 150, 400, 'exterior', '["Hot/Humid","Mixed/Humid","Marine"]', NULL, NULL),
  ('Inspect Roof for Damage', 'exterior', 'annual', 100, 300, 'roof', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Check and Repair Driveway/Walkway Cracks', 'exterior', 'annual', 50, 300, 'exterior', '["Cold","Mixed/Humid","Mixed/Dry"]', NULL, NULL),
  ('Trim Trees and Shrubs Away from House', 'exterior', 'annual', 100, 500, 'exterior', '["Hot/Humid","Mixed/Humid","Cold","Marine"]', NULL, NULL),

  -- INTERIOR
  ('Deep Clean Kitchen Appliances', 'interior', 'biannual', 0, 50, 'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Check Attic for Moisture and Pests', 'interior', 'annual', 0, 200, 'interior', '["Hot/Humid","Mixed/Humid","Cold","Marine"]', NULL, NULL),
  ('Inspect Foundation for Cracks', 'interior', 'annual', 0, 300, 'interior', '["Cold","Mixed/Humid","Mixed/Dry"]', NULL, NULL),

  -- APPLIANCES
  ('Clean Refrigerator Coils', 'appliances', 'biannual', 0, 30, 'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Clean Dryer Vent', 'appliances', 'annual', 70, 150, 'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),
  ('Inspect Washing Machine Hoses', 'appliances', 'annual', 0, 60, 'appliance', '["Hot/Humid","Mixed/Humid","Cold","Mixed/Dry","Marine"]', NULL, NULL),

  -- SEASONAL
  ('Winterize Irrigation System', 'seasonal', 'annual', 50, 150, 'plumbing', '["Cold","Mixed/Humid","Mixed/Dry"]', NULL, NULL),
  ('Prepare Home for Hurricane Season', 'seasonal', 'annual', 100, 500, 'exterior', '["Hot/Humid"]', NULL, NULL)
ON CONFLICT DO NOTHING;

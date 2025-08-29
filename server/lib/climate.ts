export type ClimateZone = 'hot' | 'cold' | 'mixed';

export function getClimateZone(zip: string): ClimateZone {
  // Stub implementation - derive climate from ZIP code
  const zipNum = parseInt(zip, 10);
  
  // Hot climates (approximate southern states)
  if (zipNum >= 30000 && zipNum <= 39999) return 'hot'; // GA, FL, AL, etc.
  if (zipNum >= 70000 && zipNum <= 79999) return 'hot'; // TX, LA, etc.
  if (zipNum >= 85000 && zipNum <= 89999) return 'hot'; // AZ, NV
  if (zipNum >= 90000 && zipNum <= 96999) return 'hot'; // CA, HI
  
  // Cold climates (approximate northern states)
  if (zipNum >= 1000 && zipNum <= 9999) return 'cold';   // New England
  if (zipNum >= 49000 && zipNum <= 59999) return 'cold'; // MN, ND, SD, etc.
  if (zipNum >= 80000 && zipNum <= 84999) return 'cold'; // CO, WY, MT, etc.
  if (zipNum >= 97000 && zipNum <= 99999) return 'cold'; // OR, WA, AK
  
  // Default to mixed for everything else
  return 'mixed';
}

export interface CoreTask {
  name: string;
  description: string;
  frequencyMonths: number;
  priority: number;
}

export function generateCoreSchedule(climateZone: ClimateZone): CoreTask[] {
  const baseTasks: CoreTask[] = [
    {
      name: 'HVAC Filter Change',
      description: 'Replace air filter to maintain air quality and system efficiency',
      frequencyMonths: climateZone === 'hot' ? 1 : 3, // More frequent in hot climates
      priority: 1,
    },
    {
      name: 'Smoke Detector Test',
      description: 'Test smoke and carbon monoxide detectors',
      frequencyMonths: 6,
      priority: 1,
    },
    {
      name: 'Gutter Cleaning',
      description: 'Clean gutters and check for proper drainage',
      frequencyMonths: climateZone === 'cold' ? 6 : 12, // More frequent in areas with snow/ice
      priority: 2,
    },
    {
      name: 'Water Heater Maintenance',
      description: 'Flush water heater and check temperature/pressure relief valve',
      frequencyMonths: 12,
      priority: 2,
    },
    {
      name: 'Caulk Inspection',
      description: 'Check and refresh caulk around windows, doors, and bathrooms',
      frequencyMonths: climateZone === 'mixed' ? 6 : 12, // More frequent in variable climates
      priority: 3,
    },
    {
      name: 'Deck/Patio Maintenance',
      description: 'Clean and inspect outdoor surfaces, apply sealant if needed',
      frequencyMonths: climateZone === 'hot' ? 6 : 12, // More frequent in intense sun
      priority: 3,
    },
  ];

  return baseTasks;
}
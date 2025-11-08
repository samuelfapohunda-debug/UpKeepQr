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

export interface ScheduledTask {
  task_code: string;
  next_due_date: Date;
  task: CoreTask;
}

export interface Household {
  id: string;
  zip: string;
  homeType: string;
  climateZone?: ClimateZone;
}

/**
 * Build initial schedule for a household
 * Rules:
 * - Monthly tasks start next month on the 1st
 * - Seasonal tasks align to climate zone and current date
 */
export function buildInitialSchedule(household: Household, tasks: CoreTask[]): ScheduledTask[] {
  const now = new Date();
  const climateZone = household.climateZone || getClimateZone(household.zip);
  
  return tasks.map((task, _index) => {
    const taskCode = task.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    let nextDueDate: Date;

    if (task.frequencyMonths === 1) {
      // Monthly tasks start next month on the 1st
      nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      // Seasonal tasks align to climate zone and current date
      nextDueDate = calculateSeasonalDueDate(now, task.frequencyMonths, climateZone);
    }

    return {
      task_code: taskCode,
      next_due_date: nextDueDate,
      task
    };
  });
}

/**
 * Calculate next due date for seasonal tasks based on climate zone
 */
function calculateSeasonalDueDate(currentDate: Date, frequencyMonths: number, climateZone: ClimateZone): Date {
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();
  
  // Define seasonal months based on climate zone
  const seasonalSchedule = getSeasonalSchedule(climateZone);
  
  // Find the next appropriate season
  let targetMonth = currentMonth;
  let targetYear = currentYear;
  
  if (frequencyMonths === 6) {
    // Semi-annual tasks - align to seasonal schedule
    const nextSeason = seasonalSchedule.find(month => month > currentMonth) || 
                       seasonalSchedule[0]; // Wrap to next year
    
    if (nextSeason <= currentMonth) {
      targetYear += 1;
    }
    targetMonth = nextSeason;
  } else if (frequencyMonths === 12) {
    // Annual tasks - align to optimal season for climate
    const optimalMonth = getOptimalAnnualMonth(climateZone);
    targetMonth = optimalMonth;
    
    // If we've passed this year's optimal month, schedule for next year
    if (currentMonth >= optimalMonth) {
      targetYear += 1;
    }
  } else {
    // For other frequencies, just add the months
    const futureDate = new Date(currentDate);
    futureDate.setMonth(currentDate.getMonth() + frequencyMonths);
    return futureDate;
  }
  
  return new Date(targetYear, targetMonth, 1);
}

/**
 * Get seasonal schedule months for different climate zones
 */
function getSeasonalSchedule(climateZone: ClimateZone): number[] {
  switch (climateZone) {
    case 'hot':
      return [2, 8]; // March (pre-summer), September (post-summer)
    case 'cold':
      return [3, 9]; // April (post-winter), October (pre-winter)
    case 'mixed':
    default:
      return [2, 8]; // March (spring), September (fall)
  }
}

/**
 * Get optimal month for annual tasks based on climate zone
 */
function getOptimalAnnualMonth(climateZone: ClimateZone): number {
  switch (climateZone) {
    case 'hot':
      return 2; // March - before hot season
    case 'cold':
      return 3; // April - after winter
    case 'mixed':
    default:
      return 2; // March - spring preparation
  }
}
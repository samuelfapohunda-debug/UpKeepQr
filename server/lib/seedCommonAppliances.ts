import { db } from '../db';
import { commonAppliancesTable } from '@shared/schema';

const commonAppliances = [
  {
    applianceType: 'HVAC System',
    category: 'HVAC',
    typicalLifespanYears: 15,
    commonBrands: ['Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman'],
    maintenanceNotes: 'Change filters every 1-3 months, annual professional inspection recommended'
  },
  {
    applianceType: 'Water Heater',
    category: 'Plumbing',
    typicalLifespanYears: 12,
    commonBrands: ['Rheem', 'AO Smith', 'Bradford White', 'Rinnai'],
    maintenanceNotes: 'Flush tank annually, check anode rod every 2-3 years'
  },
  {
    applianceType: 'Furnace',
    category: 'HVAC',
    typicalLifespanYears: 20,
    commonBrands: ['Carrier', 'Trane', 'Lennox', 'Goodman'],
    maintenanceNotes: 'Annual professional inspection, check filters monthly'
  },
  {
    applianceType: 'Central Air Conditioner',
    category: 'HVAC',
    typicalLifespanYears: 15,
    commonBrands: ['Carrier', 'Trane', 'Lennox', 'Rheem'],
    maintenanceNotes: 'Clean condenser coils annually, check refrigerant levels'
  },
  {
    applianceType: 'Refrigerator',
    category: 'Kitchen',
    typicalLifespanYears: 13,
    commonBrands: ['Samsung', 'LG', 'Whirlpool', 'GE', 'Frigidaire'],
    maintenanceNotes: 'Clean condenser coils twice yearly, check door seals'
  },
  {
    applianceType: 'Dishwasher',
    category: 'Kitchen',
    typicalLifespanYears: 10,
    commonBrands: ['Bosch', 'KitchenAid', 'Whirlpool', 'Samsung', 'LG'],
    maintenanceNotes: 'Clean filter monthly, run cleaning cycle monthly'
  },
  {
    applianceType: 'Washing Machine',
    category: 'Laundry',
    typicalLifespanYears: 11,
    commonBrands: ['LG', 'Samsung', 'Whirlpool', 'Maytag', 'GE'],
    maintenanceNotes: 'Clean door gasket monthly, run cleaning cycle monthly'
  },
  {
    applianceType: 'Dryer',
    category: 'Laundry',
    typicalLifespanYears: 13,
    commonBrands: ['LG', 'Samsung', 'Whirlpool', 'Maytag', 'GE'],
    maintenanceNotes: 'Clean lint trap after each use, clean vent duct annually'
  },
  {
    applianceType: 'Oven/Range',
    category: 'Kitchen',
    typicalLifespanYears: 15,
    commonBrands: ['GE', 'Whirlpool', 'Samsung', 'LG', 'Frigidaire'],
    maintenanceNotes: 'Clean regularly, inspect burners and heating elements'
  },
  {
    applianceType: 'Garbage Disposal',
    category: 'Kitchen',
    typicalLifespanYears: 12,
    commonBrands: ['InSinkErator', 'Waste King', 'Moen'],
    maintenanceNotes: 'Run cold water during use, clean with ice and citrus monthly'
  },
  {
    applianceType: 'Sump Pump',
    category: 'Plumbing',
    typicalLifespanYears: 10,
    commonBrands: ['Wayne', 'Zoeller', 'Superior Pump'],
    maintenanceNotes: 'Test quarterly, clean pit annually'
  },
  {
    applianceType: 'Heat Pump',
    category: 'HVAC',
    typicalLifespanYears: 15,
    commonBrands: ['Carrier', 'Trane', 'Lennox', 'Rheem', 'Mitsubishi'],
    maintenanceNotes: 'Change filters monthly, annual professional service'
  },
  {
    applianceType: 'Microwave',
    category: 'Kitchen',
    typicalLifespanYears: 10,
    commonBrands: ['Samsung', 'LG', 'GE', 'Panasonic', 'Whirlpool'],
    maintenanceNotes: 'Clean interior regularly, check door seal'
  },
  {
    applianceType: 'Freezer',
    category: 'Kitchen',
    typicalLifespanYears: 15,
    commonBrands: ['GE', 'Frigidaire', 'Whirlpool', 'Kenmore'],
    maintenanceNotes: 'Defrost as needed, clean condenser coils annually'
  },
  {
    applianceType: 'Tankless Water Heater',
    category: 'Plumbing',
    typicalLifespanYears: 20,
    commonBrands: ['Rinnai', 'Rheem', 'Navien', 'Noritz'],
    maintenanceNotes: 'Flush annually, check for scale buildup'
  }
];

export async function seedCommonAppliances() {
  try {
    console.log('Seeding common appliances...');
    
    for (const appliance of commonAppliances) {
      await db.insert(commonAppliancesTable)
        .values(appliance)
        .onConflictDoNothing({ target: commonAppliancesTable.applianceType });
    }
    
    console.log(`Seeded ${commonAppliances.length} common appliances`);
  } catch (error) {
    console.error('Error seeding common appliances:', error);
    throw error;
  }
}

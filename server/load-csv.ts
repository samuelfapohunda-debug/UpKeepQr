import fs from 'fs';
import path from 'path';
import { db } from './db';
import { homeMaintenanceTasksTable } from '../shared/schema';

interface CSVRow {
  task_code: string;
  category: string;
  task_name: string;
  base_frequency: string;
  months_hot_humid: string;
  months_cold_snow: string;
  months_mixed: string;
  months_arid_mountain: string;
  seasonal_tag: string;
  how_to: string;
  why_it_matters: string;
  est_minutes: string;
  materials: string;
  safety_note: string;
  applies_if_freeze: string;
  applies_if_hurricane: string;
  applies_if_wildfire: string;
  applies_if_hard_water: string;
  applies_if_has_sprinklers: string;
  pro_service_recommended: string;
  diy_ok: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} values but expected ${headers.length}, skipping`);
      continue;
    }

    const row: any = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || null;
    }
    rows.push(row as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function convertToBoolean(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true';
}

function convertToNumber(value: string): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

async function loadCSVData() {
  try {
    console.log('Loading CSV data into database...');
    
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'attached_assets', 'Home_Maintenance___Tasks_Master__Preview__1757016785589.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const rows = parseCSV(csvContent);
    console.log(`Parsed ${rows.length} rows from CSV`);

    // Clear existing data
    await db.delete(homeMaintenanceTasksTable);
    console.log('Cleared existing data');

    // Insert new data
    for (const row of rows) {
      const taskData = {
        taskCode: row.task_code,
        category: row.category,
        taskName: row.task_name,
        baseFrequency: row.base_frequency,
        monthsHotHumid: row.months_hot_humid || null,
        monthsColdSnow: row.months_cold_snow || null,
        monthsMixed: row.months_mixed || null,
        monthsAridMountain: row.months_arid_mountain || null,
        seasonalTag: row.seasonal_tag || null,
        howTo: row.how_to,
        whyItMatters: row.why_it_matters || 'Helps maintain your home properly.',
        estMinutes: convertToNumber(row.est_minutes),
        materials: row.materials || null,
        safetyNote: row.safety_note || null,
        appliesIfFreeze: convertToBoolean(row.applies_if_freeze),
        appliesIfHurricane: convertToBoolean(row.applies_if_hurricane),
        appliesIfWildfire: convertToBoolean(row.applies_if_wildfire),
        appliesIfHardWater: convertToBoolean(row.applies_if_hard_water),
        appliesIfHasSprinklers: convertToBoolean(row.applies_if_has_sprinklers),
        proServiceRecommended: convertToBoolean(row.pro_service_recommended),
        diyOk: convertToBoolean(row.diy_ok),
      };

      await db.insert(homeMaintenanceTasksTable).values(taskData);
    }

    console.log(`Successfully loaded ${rows.length} home maintenance tasks into the database`);
    
    // Verify data was loaded
    const count = await db.select().from(homeMaintenanceTasksTable);
    console.log(`Database now contains ${count.length} home maintenance tasks`);

  } catch (error) {
    console.error('Error loading CSV data:', error);
    throw error;
  }
}

// Run if this file is executed directly
loadCSVData()
  .then(() => {
    console.log('CSV loading completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('CSV loading failed:', error);
    process.exit(1);
  });

export { loadCSVData };
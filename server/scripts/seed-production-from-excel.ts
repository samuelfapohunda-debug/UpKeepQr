/**
 * Production Database Seeding Script
 * 
 * Reads maintenance tasks from Excel and seeds them into production database.
 * Also generates task assignments for all completed households.
 * 
 * Usage:
 *   DATABASE_URL="postgres://..." npx tsx server/scripts/seed-production-from-excel.ts
 */

import XLSX from 'xlsx';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { 
  homeMaintenanceTasksTable, 
  householdsTable, 
  householdTaskAssignmentsTable,
  reminderQueueTable,
  homeProfileExtras
} from '../../shared/schema.js';

const { Pool } = pg;

interface ExcelRow {
  task_code: string;
  category: string;
  task_name: string;
  base_frequency: string;
  months_hot_humid?: string;
  months_cold_snow?: string;
  months_mixed?: string;
  months_arid_mountain?: string;
  how_to: string;
  why_it_matters: string;
  est_minutes: number;
  materials?: string;
  safety_note?: string;
  applies_if_freeze: number;
  applies_if_hurricane: number;
  applies_if_wildfire: number;
  applies_if_hard_water: number;
  applies_if_has_sprinklers: number;
  pro_service_recommended: number;
  diy_ok: number;
}

interface HomeProfile {
  homeType?: string;
  hvacType?: string;
  waterHeaterType?: string;
  roofAgeYears?: number;
  squareFootage?: number;
}

const EXCEL_FILE_PATH = 'attached_assets/Home_Maintenance___Tasks_Master__Preview__1766940658662.xlsx';

function getReminderDaysForPriority(priority: 'high' | 'medium' | 'low'): number[] {
  switch (priority) {
    case 'high': return [7, 3, 1, 0];
    case 'medium': return [7, 1, 0];
    case 'low': return [3, 0];
    default: return [3, 0];
  }
}

function calculateDueDate(today: Date, daysFromNow: number): Date {
  const due = new Date(today);
  due.setDate(due.getDate() + daysFromNow);
  return due;
}

function cleanText(text: any): string | null {
  if (text === undefined || text === null) return null;
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .trim() || null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is required\n');
    console.log('Usage:');
    console.log('  DATABASE_URL="postgres://user:pass@host/db" npx tsx server/scripts/seed-production-from-excel.ts\n');
    process.exit(1);
  }

  console.log('\n🔗 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log(`📖 Reading Excel file: ${EXCEL_FILE_PATH}`);
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log(`   Found ${data.length} tasks in Excel file\n`);

  // ===== STEP 1: Seed Tasks =====
  console.log('═══════════════════════════════════════════════════');
  console.log('  STEP 1: Seeding home_maintenance_tasks');
  console.log('═══════════════════════════════════════════════════\n');
  
  let inserted = 0;
  let skipped = 0;
  
  for (const row of data) {
    try {
      const taskData = {
        taskCode: cleanText(row.task_code) || row.task_code,
        category: cleanText(row.category) || row.category,
        taskName: cleanText(row.task_name) || row.task_name,
        baseFrequency: cleanText(row.base_frequency) || row.base_frequency,
        monthsHotHumid: cleanText(row.months_hot_humid),
        monthsColdSnow: cleanText(row.months_cold_snow),
        monthsMixed: cleanText(row.months_mixed),
        monthsAridMountain: cleanText(row.months_arid_mountain),
        seasonalTag: null,
        howTo: cleanText(row.how_to) || row.how_to || 'Follow standard maintenance procedures.',
        whyItMatters: cleanText(row.why_it_matters) || row.why_it_matters || 'Regular maintenance helps prevent costly repairs and extends equipment life.',
        estMinutes: row.est_minutes || 30,
        materials: cleanText(row.materials),
        safetyNote: cleanText(row.safety_note),
        appliesIfFreeze: row.applies_if_freeze === 1,
        appliesIfHurricane: row.applies_if_hurricane === 1,
        appliesIfWildfire: row.applies_if_wildfire === 1,
        appliesIfHardWater: row.applies_if_hard_water === 1,
        appliesIfHasSprinklers: row.applies_if_has_sprinklers === 1,
        proServiceRecommended: row.pro_service_recommended === 1,
        diyOk: row.diy_ok === 1
      };

      const existing = await db
        .select({ id: homeMaintenanceTasksTable.id })
        .from(homeMaintenanceTasksTable)
        .where(eq(homeMaintenanceTasksTable.taskCode, taskData.taskCode))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`  ⏭️  SKIP: ${taskData.taskName} (exists)`);
        skipped++;
      } else {
        await db.insert(homeMaintenanceTasksTable).values(taskData);
        console.log(`  ✅ INSERT: ${taskData.taskName}`);
        inserted++;
      }
    } catch (error: any) {
      console.error(`  ❌ ERROR: ${row.task_name} - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Task seeding complete: ${inserted} inserted, ${skipped} skipped\n`);

  // ===== STEP 2: Generate Tasks for Households =====
  console.log('═══════════════════════════════════════════════════');
  console.log('  STEP 2: Generating tasks for completed households');
  console.log('═══════════════════════════════════════════════════\n');
  
  const completedHouseholds = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.setupStatus, 'completed'));
  
  console.log(`📋 Found ${completedHouseholds.length} completed households\n`);

  const allTasks = await db.select().from(homeMaintenanceTasksTable);
  console.log(`📚 Task catalog has ${allTasks.length} tasks\n`);

  let householdsProcessed = 0;
  let householdsSkipped = 0;

  for (const household of completedHouseholds) {
    console.log(`\n👤 Processing: ${household.name} (${household.id})`);
    
    const existingAssignments = await db
      .select({ id: householdTaskAssignmentsTable.id })
      .from(householdTaskAssignmentsTable)
      .where(eq(householdTaskAssignmentsTable.householdId, household.id))
      .limit(1);
    
    if (existingAssignments.length > 0) {
      console.log(`   ⏭️  Already has task assignments, skipping`);
      householdsSkipped++;
      continue;
    }

    const homeProfiles = await db
      .select()
      .from(homeProfileExtras)
      .where(eq(homeProfileExtras.householdId, household.id))
      .limit(1);
    
    const homeProfile: HomeProfile = homeProfiles[0] || {
      homeType: 'single_family',
      hvacType: 'central_air',
      waterHeaterType: 'tank_electric'
    };

    console.log(`   📍 Home: ${homeProfile.homeType || 'unknown'}, HVAC: ${homeProfile.hvacType || 'unknown'}`);

    const assignments = generateTasksForProfile(allTasks, homeProfile);
    console.log(`   📝 Generated ${assignments.length} tasks`);

    const today = new Date();
    const assignmentValues = assignments.map(a => ({
      householdId: household.id,
      taskId: a.taskId,
      scheduledDate: a.dueDate,
      status: 'pending' as const,
      priority: a.priority,
      createdAt: today,
      updatedAt: today
    }));

    if (assignmentValues.length > 0) {
      await db.insert(householdTaskAssignmentsTable).values(assignmentValues);
    }

    const reminderEntries: any[] = [];
    const notificationMethod = household.notificationPreference === 'sms_only' ? 'sms' : 'email';

    for (const assignment of assignments) {
      const dueDateStr = assignment.dueDate.toISOString().split('T')[0];
      const reminderDays = getReminderDaysForPriority(assignment.priority);
      
      for (const daysBeforeDue of reminderDays) {
        const runAt = new Date(assignment.dueDate);
        runAt.setDate(runAt.getDate() - daysBeforeDue);
        runAt.setHours(14, 0, 0, 0);
        
        if (runAt > today) {
          reminderEntries.push({
            householdId: household.id,
            taskId: String(assignment.taskId),
            taskName: assignment.taskName,
            taskDescription: assignment.description,
            dueDate: dueDateStr,
            runAt,
            method: notificationMethod,
            status: 'pending',
            createdAt: today,
            updatedAt: today
          });
        }
      }
    }

    if (reminderEntries.length > 0) {
      await db.insert(reminderQueueTable).values(reminderEntries);
      console.log(`   📬 Created ${reminderEntries.length} reminders`);
    }

    householdsProcessed++;
  }

  await pool.end();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SEEDING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n  Tasks inserted: ${inserted}`);
  console.log(`  Tasks skipped: ${skipped}`);
  console.log(`  Households processed: ${householdsProcessed}`);
  console.log(`  Households skipped: ${householdsSkipped}\n`);
}

interface TaskAssignment {
  taskId: number;
  taskName: string;
  category: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
}

function generateTasksForProfile(allTasks: any[], homeProfile: HomeProfile): TaskAssignment[] {
  const today = new Date();
  const assignments: TaskAssignment[] = [];

  for (const task of allTasks) {
    let shouldAssign = false;
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let daysUntilDue = 30;

    if (task.category === 'HVAC') {
      if (homeProfile.hvacType && homeProfile.hvacType !== 'none') {
        shouldAssign = true;
        if (task.taskCode?.includes('FILTER')) {
          priority = 'high';
          daysUntilDue = 14;
        } else if (task.taskCode?.includes('CONDENSER')) {
          priority = 'medium';
          daysUntilDue = 45;
        } else {
          daysUntilDue = 60;
        }
      }
    }
    else if (task.category === 'Plumbing') {
      if (task.taskCode?.includes('LEAK')) {
        shouldAssign = true;
        priority = 'medium';
        daysUntilDue = 30;
      }
      if (task.taskCode?.includes('WATER_HEATER')) {
        if (homeProfile.waterHeaterType?.includes('tank')) {
          shouldAssign = true;
          priority = 'medium';
          daysUntilDue = 90;
        }
      }
    }
    else if (task.category === 'Exterior') {
      if (homeProfile.homeType === 'single_family' || homeProfile.homeType === 'townhouse') {
        shouldAssign = true;
        if (task.taskCode?.includes('GUTTER') || task.taskCode?.includes('ROOF')) {
          priority = homeProfile.roofAgeYears && homeProfile.roofAgeYears > 10 ? 'high' : 'medium';
          daysUntilDue = 45;
        } else {
          daysUntilDue = 90;
        }
      }
    }
    else if (task.category === 'Seasonal') {
      shouldAssign = true;
      priority = 'high';
      daysUntilDue = 30;
    }
    else if (task.category === 'Appliance') {
      shouldAssign = true;
      if (task.taskCode?.includes('DRYER')) {
        priority = 'high';
        daysUntilDue = 90;
      } else {
        priority = 'medium';
        daysUntilDue = 120;
      }
    }
    else if (task.category === 'Safety') {
      shouldAssign = true;
      priority = 'high';
      daysUntilDue = 7;
    }

    if (shouldAssign) {
      assignments.push({
        taskId: task.id,
        taskName: task.taskName,
        category: task.category,
        description: task.howTo || '',
        dueDate: calculateDueDate(today, daysUntilDue),
        priority
      });
    }
  }

  return assignments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

main().catch(err => {
  console.error('\n❌ Script failed:', err.message);
  process.exit(1);
});

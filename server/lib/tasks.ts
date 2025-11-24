import { eq, sql } from 'drizzle-orm';
import { 
  homeMaintenanceTasksTable, 
  householdTaskAssignmentsTable, 
  type HomeMaintenanceTask 
} from '../../shared/schema';

/**
 * Home profile data structure for task generation
 */
export interface HomeProfile {
  homeType?: string;
  hvacType?: string;
  waterHeaterType?: string;
  roofAgeYears?: number;
  squareFootage?: number;
}

/**
 * Task assignment result
 */
interface TaskAssignment {
  taskId: number;
  taskName: string;
  category: string;
  frequency: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate due date from today
 */
function calculateDueDate(today: Date, daysFromNow: number): Date {
  const due = new Date(today);
  due.setDate(due.getDate() + daysFromNow);
  return due;
}

/**
 * Generate personalized maintenance tasks for a household
 * 
 * IMPORTANT: This function must be called with a transaction object (tx)
 * when inside a transaction. It will use the passed transaction to ensure
 * atomicity with other setup operations.
 * 
 * @param tx - Database transaction object
 * @param householdId - Household ID to assign tasks to
 * @param homeProfile - Home details (hvacType, waterHeaterType, roofAgeYears, etc.)
 * @returns Array of created task assignments
 */
export async function generateMaintenanceTasks(
  tx: any, // Transaction object from db.transaction()
  householdId: string,
  homeProfile: HomeProfile
): Promise<TaskAssignment[]> {
  try {
    console.log(`📋 Generating tasks for household ${householdId}...`);
    
    // Check if household already has tasks (idempotency)
    const existingTasks = await tx
      .select()
      .from(householdTaskAssignmentsTable)
      .where(eq(householdTaskAssignmentsTable.householdId, householdId))
      .limit(1);
    
    if (existingTasks.length > 0) {
      console.log(`⚠️ Household ${householdId} already has tasks assigned. Skipping.`);
      return [];
    }
    
    // Fetch all tasks from catalog
    const allTasks: HomeMaintenanceTask[] = await tx
      .select()
      .from(homeMaintenanceTasksTable)
      .execute();
    
    if (allTasks.length === 0) {
      console.warn('⚠️ No tasks found in catalog. Run seed script first.');
      return [];
    }
    
    const today = new Date();
    const assignments: TaskAssignment[] = [];
    
    // Iterate through tasks and determine which ones apply
    for (const task of allTasks) {
      let shouldAssign = false;
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let daysUntilDue = 30; // Default: 30 days from now
      
      // CRITICAL: Use else-if to ensure categories are mutually exclusive
      // This prevents logic bugs where one category overwrites another's decision
      
      // HVAC tasks
      if (task.category === 'HVAC') {
        // Only assign if household has HVAC
        if (homeProfile.hvacType && homeProfile.hvacType !== 'none') {
          shouldAssign = true;
          
          if (task.taskCode === 'HVAC_FILTER_CHANGE') {
            priority = 'high'; // Critical for air quality
            daysUntilDue = 14; // Due in 2 weeks
          }
          
          if (task.taskCode === 'HVAC_ANNUAL_SERVICE') {
            priority = 'medium';
            daysUntilDue = 60; // Schedule within 2 months
          }
          
          if (task.taskCode === 'HVAC_CONDENSER_CLEAN') {
            priority = 'medium';
            daysUntilDue = 45; // Before summer
          }
          
          if (task.taskCode === 'FURNACE_FILTER_WINTER') {
            // Only if they have heating
            if (homeProfile.hvacType === 'central_air' || 
                homeProfile.hvacType === 'heat_pump' || 
                homeProfile.hvacType === 'forced_air') {
              priority = 'high';
              daysUntilDue = 14;
            } else {
              shouldAssign = false;
            }
          }
        }
      }
      // Plumbing tasks
      else if (task.category === 'Plumbing') {
        // Leak inspection - always important
        if (task.taskCode === 'LEAK_INSPECTION') {
          shouldAssign = true;
          priority = 'medium';
          daysUntilDue = 30;
        }
        
        // Water heater tasks - ONLY for tank water heaters
        if (task.taskCode === 'WATER_HEATER_FLUSH' || task.taskCode === 'WATER_HEATER_ANODE') {
          if (homeProfile.waterHeaterType === 'tank_gas' || 
              homeProfile.waterHeaterType === 'tank_electric') {
            shouldAssign = true;
            
            if (task.taskCode === 'WATER_HEATER_FLUSH') {
              priority = 'medium';
              daysUntilDue = 90; // 3 months
            }
            
            if (task.taskCode === 'WATER_HEATER_ANODE') {
              priority = 'low';
              daysUntilDue = 180; // 6 months
            }
          }
        }
      }
      // Exterior tasks - ONLY for single_family or townhouse
      else if (task.category === 'Exterior') {
        // Check home type FIRST before assigning any exterior tasks
        if (homeProfile.homeType === 'single_family' || 
            homeProfile.homeType === 'townhouse') {
          shouldAssign = true;
          
          if (task.taskCode === 'GUTTER_CLEANING') {
            priority = 'high';
            daysUntilDue = 45;
          }
          
          if (task.taskCode === 'ROOF_INSPECTION') {
            if (homeProfile.roofAgeYears && homeProfile.roofAgeYears > 10) {
              priority = 'high';
              daysUntilDue = 30;
            } else {
              priority = 'medium';
              daysUntilDue = 90;
            }
          }
          
          if (task.taskCode === 'PRESSURE_WASH') {
            priority = 'low';
            daysUntilDue = 120;
          }
          
          if (task.taskCode === 'DECK_SEAL') {
            priority = 'medium';
            daysUntilDue = 90;
          }
          
          if (task.taskCode === 'CAULK_INSPECTION') {
            priority = 'medium';
            daysUntilDue = 60;
          }
          
          if (task.taskCode === 'SPRINKLER_WINTERIZE' || 
              task.taskCode === 'SPRINKLER_SPRING_START') {
            priority = 'medium';
            daysUntilDue = task.taskCode === 'SPRINKLER_WINTERIZE' ? 60 : 90;
          }
        }
        // If not single_family/townhouse, shouldAssign stays false (no exterior tasks)
      }
      // Seasonal tasks
      else if (task.category === 'Seasonal') {
        shouldAssign = true;
        
        // Winterization (fall)
        if (task.taskCode === 'WINTERIZATION') {
          const month = today.getMonth();
          // Schedule for fall (Sept-Nov)
          if (month < 8) { // Before September
            daysUntilDue = (8 - month) * 30; // Days until September
          } else {
            daysUntilDue = 30;
          }
          priority = 'high';
        }
        
        // Spring maintenance
        if (task.taskCode === 'SPRING_MAINTENANCE') {
          const month = today.getMonth();
          // Schedule for spring (March-May)
          if (month < 2) { // Before March
            daysUntilDue = (2 - month) * 30;
          } else if (month > 4) { // After May
            daysUntilDue = (12 - month + 2) * 30; // Next spring
          } else {
            daysUntilDue = 30;
          }
          priority = 'high';
        }
      }
      // Appliance tasks - always applicable
      else if (task.category === 'Appliance') {
        shouldAssign = true;
        
        if (task.taskCode === 'DRYER_VENT_CLEAN') {
          priority = 'high'; // Fire hazard
          daysUntilDue = 90;
        }
        
        if (task.taskCode === 'FRIDGE_COILS_CLEAN') {
          priority = 'medium';
          daysUntilDue = 120;
        }
      }
      // Safety tasks - ALWAYS assign, highest priority
      else if (task.category === 'Safety') {
        shouldAssign = true;
        priority = 'high';
        
        if (task.taskCode === 'SMOKE_DETECTOR_TEST') {
          daysUntilDue = 7; // Test within a week
        }
        
        if (task.taskCode === 'FIRE_EXTINGUISHER_CHECK') {
          daysUntilDue = 7;
        }
      }
      
      // Create assignment if task applies
      if (shouldAssign) {
        const dueDate = calculateDueDate(today, daysUntilDue);
        
        assignments.push({
          taskId: task.id,
          taskName: task.taskName,
          category: task.category,
          frequency: task.baseFrequency,
          dueDate,
          priority
        });
      }
    }
    
    // Sort by due date (soonest first)
    assignments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    
    // Batch insert all assignments (single query, not N queries)
    if (assignments.length > 0) {
      const assignmentValues = assignments.map(assignment => ({
        householdId,
        taskId: assignment.taskId,
        dueDate: assignment.dueDate, // Pass as Date object, Drizzle will handle conversion
        frequency: assignment.frequency,
        status: 'pending',
        priority: assignment.priority
        // createdAt and updatedAt have defaultNow() in schema, don't provide manually
      }));
      
      await tx.insert(householdTaskAssignmentsTable).values(assignmentValues);
    }
    
    console.log(`✅ Created ${assignments.length} task assignments for household ${householdId}`);
    
    return assignments;
    
  } catch (error) {
    console.error('❌ Error generating maintenance tasks:', error);
    throw error;
  }
}

/**
 * Get upcoming tasks for a household
 * Note: This function uses db directly, not transaction.
 * Only call outside of active transactions.
 */
export async function getUpcomingTasks(
  db: any, // Database instance
  householdId: string,
  daysAhead: number = 30
): Promise<any[]> {
  const futureDate = calculateDueDate(new Date(), daysAhead);
  
  const tasks = await db
    .select({
      assignment: householdTaskAssignmentsTable,
      task: homeMaintenanceTasksTable
    })
    .from(householdTaskAssignmentsTable)
    .leftJoin(
      homeMaintenanceTasksTable,
      sql`${householdTaskAssignmentsTable.taskId} = ${homeMaintenanceTasksTable.id}`
    )
    .where(sql`
      ${householdTaskAssignmentsTable.householdId} = ${householdId}
      AND ${householdTaskAssignmentsTable.status} = 'pending'
      AND ${householdTaskAssignmentsTable.dueDate} <= ${futureDate.toISOString().split('T')[0]}
    `)
    .orderBy(householdTaskAssignmentsTable.dueDate)
    .execute();
  
  return tasks;
}

import { Router, Request, Response } from "express";
import { db } from "../../db.js";
import {
  maintenanceTasksTable,
  homeProfilesTable,
  householdsTable,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { generateMaintenanceSchedule } from "../../services/homeResearchAgent.js";

const router = Router();

// Helper — validate householdId is present
function requireHouseholdId(householdId: unknown, res: Response): householdId is string {
  if (!householdId || typeof householdId !== "string") {
    res.status(400).json({ error: "householdId is required" });
    return false;
  }
  return true;
}

/**
 * GET /api/maintenance/tasks
 * Returns maintenance_tasks for a household.
 * Query params: householdId (required), month, category, is_completed
 */
router.get("/tasks", async (req: Request, res: Response) => {
  try {
    const { householdId, month, category, is_completed } = req.query;
    if (!requireHouseholdId(householdId, res)) return;

    const conditions = [eq(maintenanceTasksTable.householdId, householdId as string)];

    if (month) {
      conditions.push(eq(maintenanceTasksTable.month, parseInt(month as string, 10)));
    }
    if (category) {
      conditions.push(eq(maintenanceTasksTable.category, category as string));
    }
    if (is_completed !== undefined) {
      conditions.push(eq(maintenanceTasksTable.isCompleted, is_completed === "true"));
    }

    const tasks = await db
      .select()
      .from(maintenanceTasksTable)
      .where(and(...conditions))
      .orderBy(maintenanceTasksTable.month, maintenanceTasksTable.priority);

    res.json({ tasks });
  } catch (error) {
    console.error("❌ GET /api/maintenance/tasks error:", error);
    res.status(500).json({ error: "Failed to fetch maintenance tasks" });
  }
});

/**
 * PATCH /api/maintenance/tasks/:id/complete
 * Marks a task as completed.
 * Body: { householdId }
 */
router.patch("/tasks/:id/complete", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { householdId } = req.body;
    if (!requireHouseholdId(householdId, res)) return;

    if (isNaN(taskId)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const [updated] = await db
      .update(maintenanceTasksTable)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ isCompleted: true, completedAt: new Date(), updatedAt: new Date() } as any)
      .where(
        and(
          eq(maintenanceTasksTable.id, taskId),
          eq(maintenanceTasksTable.householdId, householdId as string)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ task: updated });
  } catch (error) {
    console.error("❌ PATCH /api/maintenance/tasks/:id/complete error:", error);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

/**
 * GET /api/maintenance/summary
 * Returns aggregate stats for a household.
 * Query params: householdId (required)
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const { householdId } = req.query;
    if (!requireHouseholdId(householdId, res)) return;

    const currentMonth = new Date().getMonth() + 1;

    const tasks = await db
      .select()
      .from(maintenanceTasksTable)
      .where(eq(maintenanceTasksTable.householdId, householdId as string));

    const totalTasks = tasks.length;
    const completedThisMonth = tasks.filter(
      (t) => t.isCompleted && t.completedAt && new Date(t.completedAt).getMonth() + 1 === currentMonth
    ).length;
    const upcomingThisMonth = tasks.filter(
      (t) => !t.isCompleted && t.month === currentMonth
    ).length;
    const annualMaintenanceBudget = tasks.reduce(
      (sum, t) => sum + (t.estimatedCostMax ?? t.estimatedCostMin ?? 0),
      0
    );

    res.json({
      total_tasks: totalTasks,
      completed_this_month: completedThisMonth,
      upcoming_this_month: upcomingThisMonth,
      annual_maintenance_budget: annualMaintenanceBudget,
    });
  } catch (error) {
    console.error("❌ GET /api/maintenance/summary error:", error);
    res.status(500).json({ error: "Failed to fetch maintenance summary" });
  }
});

/**
 * POST /api/maintenance/regenerate
 * Deletes existing tasks and re-runs AI generation.
 * Body: { householdId }
 */
router.post("/regenerate", async (req: Request, res: Response) => {
  try {
    const { householdId } = req.body;
    if (!requireHouseholdId(householdId, res)) return;

    // Fetch existing home profile
    const [profile] = await db
      .select()
      .from(homeProfilesTable)
      .where(eq(homeProfilesTable.householdId, householdId as string))
      .limit(1);

    // Fall back to households table for address if no profile yet
    const [household] = await db
      .select()
      .from(householdsTable)
      .where(eq(householdsTable.id, householdId as string))
      .limit(1);

    if (!household) {
      return res.status(404).json({ error: "Household not found" });
    }

    // Delete existing maintenance tasks
    await db
      .delete(maintenanceTasksTable)
      .where(eq(maintenanceTasksTable.householdId, householdId as string));

    // Reset schedule_generated_at so the cache guard doesn't short-circuit
    if (profile) {
      await db
        .update(homeProfilesTable)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set({ scheduleGeneratedAt: null, updatedAt: new Date() } as any)
        .where(eq(homeProfilesTable.householdId, householdId as string));
    }

    const tasks = await generateMaintenanceSchedule({
      householdId: householdId as string,
      address: profile?.address ?? household.addressLine1 ?? "",
      city: profile?.city ?? household.city ?? "",
      state: profile?.state ?? household.state ?? "",
      zip: profile?.zip ?? household.zipcode ?? "",
      yearBuilt: profile?.yearBuilt ?? undefined,
      squareFootage: profile?.squareFootage ?? undefined,
      homeType: profile?.homeType ?? undefined,
      roofType: profile?.roofType ?? undefined,
      hvacType: profile?.hvacType ?? undefined,
      appliances: (profile?.appliances as string[]) ?? [],
    });

    res.json({ tasks });
  } catch (error) {
    console.error("❌ POST /api/maintenance/regenerate error:", error);
    res.status(500).json({ error: "Failed to regenerate maintenance schedule" });
  }
});

export default router;

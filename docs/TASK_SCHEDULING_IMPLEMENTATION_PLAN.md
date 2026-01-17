# Task Scheduling Implementation Plan
## Immediate Actions Required

**Reference:** See `docs/TASK_SCHEDULING_COMPLETE_SPECIFICATION.md` for full details

---

## CRITICAL ISSUES FOUND

1. ❌ **Task Catalog Empty** - `home_maintenance_tasks` table has 0 records
2. ❌ **Cron Jobs Not Starting** - No initialization in `server/src/index.ts`
3. ⚠️ **Only 3 Tasks Exist** - All for test household, 0 for production households

---

## IMPLEMENTATION SEQUENCE

### STEP 1: Seed Task Catalog (30 minutes)
**File:** `server/scripts/seed-tasks.ts`
**Action:** Create script with all 32 maintenance tasks
**Command:** `DATABASE_URL='production-url' npx tsx server/scripts/seed-tasks.ts`
**Verification:** `SELECT COUNT(*) FROM home_maintenance_tasks;` → Should return 32

### STEP 2: Initialize Cron Jobs (5 minutes)
**File:** `server/src/index.ts`
**Action:** Add after all routes:
```typescript
import { startCronJobs } from '../lib/cron.js';
startCronJobs();
console.log('✅ Cron jobs initialized');
```
**Verification:** Check server logs for "Cron jobs started successfully"

### STEP 3: Deploy & Test (10 minutes)
**Actions:**
1. Build: `npm run build`
2. Deploy to Render
3. Create new test household
4. Verify tasks auto-generated
5. Check reminders created in `reminder_queue`

---

## TASK DEFINITIONS SUMMARY

**32 Total Tasks** across 6 categories:
- HVAC: 7 tasks (filtered by `hvacType`)
- Plumbing: 6 tasks (filtered by `waterHeaterType`)
- Exterior: 7 tasks (filtered by `homeType` - skip for condos)
- Safety: 4 tasks (always assigned)
- Appliances: 5 tasks (always assigned)
- Other: 3 tasks (always assigned)

**See full specification for:**
- Complete task list with codes, frequencies, priorities
- Filtering logic by home profile
- Due date calculation formulas
- Reminder schedule by priority
- Task lifecycle management

---

## SUCCESS CRITERIA

✅ Task catalog has 32 records  
✅ Cron jobs start on server boot  
✅ New households auto-generate 12-32 tasks (based on profile)  
✅ Reminders created in `reminder_queue`  
✅ Daily cron job runs at 9 AM EST  
✅ Overdue tasks marked correctly


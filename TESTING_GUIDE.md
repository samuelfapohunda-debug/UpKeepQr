# Task Scheduling System - Testing Guide

**Deployment:** Render auto-deploying from GitHub (2aa42ca)  
**Date:** December 21, 2025

---

## 🔍 PRE-DEPLOYMENT CHECKS

### 1. Monitor Render Deployment
- Go to: https://dashboard.render.com
- Click: UpKeepQr-backend service
- Watch: Deployment logs
- Look for: `✅ Cron jobs initialized (daily at 9 AM EST)`

---

## ✅ POST-DEPLOYMENT TESTING

### TEST 1: Verify Task Catalog Seeded

**Database Query:**
```sql
SELECT COUNT(*) as total_tasks FROM home_maintenance_tasks;
-- Expected: 32

SELECT category, COUNT(*) as count 
FROM home_maintenance_tasks 
GROUP BY category 
ORDER BY category;
-- Expected:
-- Appliances: 5
-- Exterior: 7
-- HVAC: 7
-- Other: 3
-- Plumbing: 6
-- Safety: 4
```

**Status:** ⏳ Pending

---

### TEST 2: Create New Household & Verify Task Generation

**Steps:**
1. Go to: https://upkeepqr.com/admin/setup-forms
2. Click: "Create Household" button
3. Fill form:
   - Name: "Test Task System"
   - Email: "test-tasks@example.com"
   - Phone: "1234567890"
   - Street: "123 Test St"
   - City: "Testville"
   - State: "GA"
   - ZIP: "30281"
   - Home Type: **single_family**
   - HVAC Type: **central_air**
   - Water Heater: **tank_gas**
   - Roof Age: **8** years
4. Submit

**Expected Results:**
- Household created successfully
- Tasks auto-generated (check database):
```sql
SELECT COUNT(*) as task_count 
FROM household_task_assignments 
WHERE household_id = 'new-household-id';
-- Expected: 25-30 tasks (depends on profile)

SELECT priority, COUNT(*) 
FROM household_task_assignments 
WHERE household_id = 'new-household-id'
GROUP BY priority;
-- Expected: Mix of 'high', 'medium', 'low'

SELECT status, COUNT(*) 
FROM household_task_assignments 
WHERE household_id = 'new-household-id'
GROUP BY status;
-- Expected: All 'pending'
```

**Status:** ⏳ Pending

---

### TEST 3: Verify Reminders Created

**Database Query:**
```sql
SELECT COUNT(*) as reminder_count 
FROM reminder_queue 
WHERE household_id = 'new-household-id'
AND status = 'pending';
-- Expected: 60-100 reminders (depends on task count)

SELECT 
  t.priority,
  COUNT(r.id) as reminder_count
FROM household_task_assignments t
JOIN reminder_queue r ON r.task_id = t.id
WHERE t.household_id = 'new-household-id'
GROUP BY t.priority;
-- Expected:
-- high: 4 reminders per task
-- medium: 3 reminders per task
-- low: 2 reminders per task
```

**Status:** ⏳ Pending

---

### TEST 4: Admin Tasks View

**Steps:**
1. Go to: https://upkeepqr.com/admin/setup-forms
2. Click on any household row
3. Modal opens
4. Click: **"Tasks"** tab (NEW!)

**Expected Display:**
- ✅ Summary cards showing:
  - Total Tasks
  - Pending (blue)
  - Overdue (red)
  - Completed (green)
- ✅ Task table with columns:
  - Task Name
  - Category (badge)
  - Due Date
  - Status (badge)
  - Priority (badge)
- ✅ Tasks sorted by due date (earliest first)
- ✅ Overdue tasks show "X days overdue" in red

**Status:** ⏳ Pending

---

### TEST 5: Verify Idempotency

**Steps:**
1. Try to create tasks for same household again
2. Run in database console (or trigger through code):
```sql
-- This should NOT create duplicates
-- (Test by checking task count before/after)
```

**Expected:** No duplicate tasks created

**Status:** ⏳ Pending

---

### TEST 6: Monitor Cron Job Execution

**Tomorrow at 9:00 AM EST (December 22, 2025):**

**Check Render Logs:**
- Look for: `Running daily maintenance job at 09:00 EST`
- Look for: `Updated overdue tasks`
- Look for: `Processing X pending reminders`

**Database Check (after 9 AM):**
```sql
-- Check if overdue tasks were marked
SELECT COUNT(*) FROM household_task_assignments 
WHERE status = 'overdue';

-- Check if reminders were processed
SELECT status, COUNT(*) FROM reminder_queue 
GROUP BY status;
-- Expected: Some 'sent' or 'failed' statuses
```

**Status:** ⏳ Pending (Tomorrow)

---

## 🐛 TROUBLESHOOTING

### Issue: Tasks not generated
**Check:**
1. Server logs for errors during household creation
2. Task catalog seeded: `SELECT COUNT(*) FROM home_maintenance_tasks;`
3. Transaction rolled back? Check error logs

### Issue: Admin Tasks tab not showing
**Check:**
1. Browser console for errors
2. Network tab: `/api/households/{id}/tasks` returns 200
3. Clear browser cache (CDN may cache old bundle)

### Issue: Cron not running
**Check:**
1. Server logs for `Cron jobs started successfully`
2. Server timezone: Should be America/New_York
3. Cron process running: Check server process list

### Issue: Reminders not created
**Check:**
1. Task assignments have valid due dates
2. Reminder creation logic in `generateMaintenanceTasks()`
3. Database foreign key constraints

---

## 📊 SUCCESS METRICS

After all tests complete:

- [ ] 32 tasks in catalog
- [ ] New households generate 20-30 tasks automatically
- [ ] Reminders created with correct scheduling (7,3,1,0 / 7,1,0 / 3,0)
- [ ] Admin can view tasks in Setup Forms Dashboard
- [ ] Summary statistics accurate
- [ ] No duplicate tasks created on retry
- [ ] Cron executes daily at 9 AM EST
- [ ] Overdue tasks marked correctly

---

## 📝 TEST RESULTS LOG

**Test 1 - Task Catalog:** ⏳  
**Test 2 - Task Generation:** ⏳  
**Test 3 - Reminders:** ⏳  
**Test 4 - Admin View:** ⏳  
**Test 5 - Idempotency:** ⏳  
**Test 6 - Cron Execution:** ⏳ (Tomorrow)  

**Overall Status:** ⏳ TESTING IN PROGRESS

---

**Next Steps:**
1. Wait for Render deployment to complete
2. Run Test 1 (verify catalog)
3. Run Test 2 (create household)
4. Run Test 3 (check reminders)
5. Run Test 4 (admin UI)
6. Run Test 5 (idempotency)
7. Monitor Test 6 tomorrow morning


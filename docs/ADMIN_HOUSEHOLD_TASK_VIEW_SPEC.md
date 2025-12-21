# Admin Household Task View Specification
## Display Scheduled Tasks in Setup Forms Dashboard

**Version:** 1.0  
**Date:** December 21, 2025  
**Status:** Ready for Implementation

---

## 1. OVERVIEW

### 1.1 Objective
Add a "Tasks" section to the household detail modal in SetupFormsDashboard that shows:
- All scheduled tasks for the household
- Task status (pending, overdue, completed)
- Task priorities and due dates
- Quick actions (mark complete, view details)

### 1.2 Benefits
- **Admin Oversight:** Monitor homeowner task compliance
- **Proactive Support:** Identify overdue tasks and reach out
- **Reporting:** Understand task completion rates
- **Troubleshooting:** Verify task generation is working

---

## 2. DATABASE REQUIREMENTS

### 2.1 New API Endpoint

**Endpoint:** `GET /api/households/:householdId/tasks`

**Purpose:** Fetch all task assignments for a household

**Response:**
```typescript
{
  tasks: [
    {
      id: "task-uuid",
      taskCode: "HVAC_FILTER_CHANGE",
      taskName: "Change HVAC Filter",
      category: "HVAC",
      dueDate: "2025-01-15",
      status: "pending", // pending, overdue, completed, skipped
      priority: "high", // high, medium, low
      frequency: "monthly",
      completedAt: null,
      daysUntilDue: 25,
      isOverdue: false
    },
    // ... more tasks
  ],
  summary: {
    total: 25,
    pending: 15,
    overdue: 3,
    completed: 7,
    skipped: 0
  }
}
```

**Implementation:**
```typescript
// server/src/routes/households.ts (NEW FILE)
import { Router } from 'express';
import { storage } from '../../storage.js';

const router = Router();

router.get('/households/:householdId/tasks', async (req, res) => {
  const { householdId } = req.params;
  
  // Get all task assignments
  const tasks = await storage.getTasksByHousehold(householdId);
  
  // Calculate summary
  const summary = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    skipped: tasks.filter(t => t.status === 'skipped').length
  };
  
  res.json({ tasks, summary });
});

export default router;
```

---

## 3. FRONTEND COMPONENTS

### 3.1 Household Detail Modal Enhancement

**Location:** `client/src/pages/SetupFormsDashboard.tsx`

**Add Tasks Tab:**
```tsx
// Inside HouseholdDetailModal component
<Tabs defaultValue="info">
  <TabsList>
    <TabsTrigger value="info">Household Info</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
    <TabsTrigger value="tasks">
      Tasks
      {taskSummary?.overdue > 0 && (
        <Badge variant="destructive" className="ml-2">
          {taskSummary.overdue} Overdue
        </Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="appliances">Appliances</TabsTrigger>
  </TabsList>
  
  <TabsContent value="info">
    {/* Existing household info */}
  </TabsContent>
  
  <TabsContent value="notes">
    {/* Existing notes */}
  </TabsContent>
  
  <TabsContent value="tasks">
    <HouseholdTasksView householdId={selectedHousehold.id} />
  </TabsContent>
  
  <TabsContent value="appliances">
    {/* Existing appliances */}
  </TabsContent>
</Tabs>
```

### 3.2 HouseholdTasksView Component

**NEW Component:** `client/src/components/HouseholdTasksView.tsx`
```tsx
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/components/ui/table';

export function HouseholdTasksView({ householdId }: { householdId: string }) {
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/households', householdId, 'tasks'],
    queryFn: async () => {
      const res = await fetch(`/api/households/${householdId}/tasks`);
      return res.json();
    }
  });
  
  if (isLoading) return <div>Loading tasks...</div>;
  
  const { tasks, summary } = data;
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.pending}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.overdue}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completed}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Task List */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                {task.taskName}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.category}</Badge>
              </TableCell>
              <TableCell>
                {new Date(task.dueDate).toLocaleDateString()}
                {task.isOverdue && (
                  <span className="text-red-600 text-xs ml-2">
                    ({Math.abs(task.daysUntilDue)} days overdue)
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={
                  task.status === 'overdue' ? 'destructive' :
                  task.status === 'completed' ? 'success' :
                  'default'
                }>
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={
                  task.priority === 'high' ? 'destructive' :
                  task.priority === 'medium' ? 'warning' :
                  'secondary'
                }>
                  {task.priority}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 4. IMPLEMENTATION STEPS

### Step 1: Create Tasks API Endpoint (15 minutes)
1. Create `server/src/routes/households.ts`
2. Add `GET /households/:householdId/tasks` endpoint
3. Register route in `server/src/index.ts`
4. Test with Postman/curl

### Step 2: Add getTasksByHousehold to Storage (10 minutes)
```typescript
// server/storage.ts
async getTasksByHousehold(householdId: string) {
  const tasks = await db.query.householdTaskAssignmentsTable.findMany({
    where: eq(householdTaskAssignmentsTable.householdId, householdId),
    with: {
      task: true // Join with home_maintenance_tasks
    },
    orderBy: [
      asc(householdTaskAssignmentsTable.dueDate)
    ]
  });
  
  // Calculate derived fields
  return tasks.map(t => ({
    ...t,
    daysUntilDue: differenceInDays(new Date(t.dueDate), new Date()),
    isOverdue: new Date(t.dueDate) < new Date() && t.status === 'pending'
  }));
}
```

### Step 3: Create HouseholdTasksView Component (30 minutes)
1. Create `client/src/components/HouseholdTasksView.tsx`
2. Implement summary cards
3. Implement task table with filters
4. Add loading/error states

### Step 4: Update SetupFormsDashboard (15 minutes)
1. Add Tabs component to household detail modal
2. Add Tasks tab with badge showing overdue count
3. Import and use HouseholdTasksView

### Step 5: Test (15 minutes)
1. Open household detail modal
2. Click "Tasks" tab
3. Verify tasks display correctly
4. Verify summary cards accurate
5. Test with household with 0 tasks
6. Test with household with overdue tasks

---

## 5. FUTURE ENHANCEMENTS

**Phase 2:**
- **Quick Actions:** Mark task complete from admin view
- **Task Filtering:** Filter by category, priority, status
- **Task Details Modal:** View full task description
- **Bulk Actions:** Mark multiple tasks complete
- **Export:** Download task list as CSV

**Phase 3:**
- **Task Assignment:** Manually assign additional tasks
- **Task Editing:** Modify due dates, priorities
- **Task Deletion:** Remove irrelevant tasks
- **Task Comments:** Admin notes on specific tasks

---

## END OF SPECIFICATION

**Status:** Ready for implementation  
**Estimated Time:** 1.5 hours  
**Priority:** Medium (nice-to-have for admin oversight)


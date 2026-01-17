# UpKeepQR Task Scheduling System Documentation

## 1. System Overview

The UpKeepQR task scheduling system automates home maintenance management by:

- **Automatic Task Generation**: Creates personalized maintenance tasks based on household profile (home type, HVAC system, appliances)
- **Smart Scheduling**: Calculates due dates based on task priority, seasonality, and home characteristics
- **Reminder Notifications**: Sends email and SMS reminders via daily cron job
- **Maintenance Logging**: Tracks completed maintenance with cost tracking and on-time metrics
- **Calendar Integration**: Google Calendar sync for task due dates
- **Warranty Tracking**: Monitors appliance warranties with 14-day expiration alerts

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| Auto Task Generation | Active | Tasks created on household activation |
| Daily Reminders | Active | 9 AM EST via node-cron |
| Email Notifications | Active | SendGrid integration |
| SMS Notifications | Active | Twilio integration |
| Google Calendar Sync | Active | OAuth 2.0 integration |
| Maintenance Logs | Active | Manual and scheduled logging |
| Warranty Alerts | Active | 14-day threshold alerts |

---

## 2. Database Schema

### Core Tables

#### `home_maintenance_tasks` (Task Catalog)
Master list of available maintenance tasks.

```
Location: shared/schema.ts (lines 298-327)

Fields:
- id: serial (primary key)
- taskCode: varchar(100) - Unique identifier (e.g., "HVAC_FILTER_CHANGE")
- category: varchar(50) - HVAC, Plumbing, Exterior, Safety, etc.
- taskName: varchar(255) - Display name
- description: text - Detailed task description
- baseFrequency: varchar(50) - monthly, quarterly, annually, seasonal
- priority: integer - 1=high, 2=medium, 3=low
- estimatedDuration: integer - Minutes to complete
- diyDifficulty: varchar(20) - easy, medium, hard
- seasonalTiming: varchar(100) - spring, fall, summer, winter
- applianceCategory: varchar(100) - Related appliance type
- createdAt: timestamp
- updatedAt: timestamp
```

#### `household_task_assignments` (Assigned Tasks)
Tasks assigned to specific households with due dates.

```
Location: shared/schema.ts (lines 944-978)

Fields:
- id: varchar (UUID, primary key)
- householdId: varchar (FK to households)
- taskId: integer (FK to home_maintenance_tasks)
- dueDate: date
- frequency: varchar(50)
- status: varchar(20) - pending, completed, skipped, overdue
- priority: varchar(10) - high, medium, low
- completedAt: timestamp
- notes: text
- createdAt: timestamp
- updatedAt: timestamp

Indexes:
- idx_household_task_assignments_household
- idx_household_task_assignments_due_date
- idx_household_task_assignments_status
- idx_household_task_assignments_task
- idx_household_task_assignments_household_status
- idx_household_task_assignments_household_due
```

#### `maintenance_logs` (Completed Tasks)
Record of all maintenance activities.

```
Location: shared/schema.ts (lines 1119-1150)

Fields:
- id: varchar (UUID, primary key)
- householdId: varchar (FK to households)
- taskAssignmentId: varchar (FK to household_task_assignments, nullable)
- applianceId: varchar (FK to household_appliances, nullable)
- maintenanceDate: date
- taskPerformed: text
- logType: varchar - scheduled, manual, emergency
- cost: varchar (nullable)
- serviceProvider: varchar (nullable)
- partsReplaced: text (nullable)
- notes: text (nullable)
- wasOnTime: boolean (nullable)
- daysLate: integer (nullable)
- createdBy: varchar - admin, customer, system
- createdByUserId: varchar (nullable)
- createdAt: timestamp
- updatedAt: timestamp

Indexes:
- idx_maintenance_logs_household
- idx_maintenance_logs_appliance
- idx_maintenance_logs_task
- idx_maintenance_logs_date
- idx_maintenance_logs_type
```

#### `household_appliances` (Appliance Registry)
Appliances registered to households.

```
Location: shared/schema.ts (lines 1072-1118)

Fields:
- id: varchar (UUID, primary key)
- householdId: varchar (FK to households)
- applianceType: varchar
- brand: varchar (nullable)
- modelNumber: varchar (nullable)
- serialNumber: varchar (nullable, unique)
- purchaseDate: date (nullable)
- warrantyExpiration: date (nullable)
- warrantyProvider: varchar (nullable)
- location: varchar (nullable)
- maintenanceNotes: text (nullable)
- isActive: boolean (default true)
- createdAt: timestamp
- updatedAt: timestamp
```

#### `common_appliances` (Appliance Catalog)
Pre-seeded list of common home appliances.

```
Location: shared/schema.ts

Fields:
- id: serial (primary key)
- name: varchar - Display name
- category: varchar - Kitchen, Laundry, HVAC, etc.
- typicalLifespanYears: integer
- maintenanceFrequency: varchar
```

### Entity Relationships

```
households (1) ──────┬──── (N) household_task_assignments
                     │              │
                     │              └──── (1) home_maintenance_tasks
                     │
                     ├──── (N) household_appliances
                     │              │
                     │              └──── (N) maintenance_logs
                     │
                     └──── (N) maintenance_logs
```

---

## 3. Data Flow Diagrams

### Task Creation Flow (On Household Activation)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ Customer Setup  │────>│ POST /api/setup/     │────>│ db.transaction()    │
│ Form Completion │     │ activate             │     │                     │
└─────────────────┘     └──────────────────────┘     └──────────┬──────────┘
                                                                 │
                        ┌────────────────────────────────────────┘
                        ▼
        ┌───────────────────────────────────────┐
        │ generateMaintenanceTasks()            │
        │ (server/lib/tasks.ts)                 │
        │                                       │
        │ 1. Check for existing tasks           │
        │ 2. Fetch task catalog                 │
        │ 3. Filter by home profile:            │
        │    - HVAC type                        │
        │    - Home type (single/condo)         │
        │    - Water heater type                │
        │    - Roof age                         │
        │ 4. Calculate due dates                │
        │ 5. Batch insert assignments           │
        └───────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │ household_task_assignments table      │
        │                                       │
        │ Created tasks with:                   │
        │ - Personalized due dates              │
        │ - Priority levels                     │
        │ - Status = 'pending'                  │
        └───────────────────────────────────────┘
```

### Task Filtering Logic

```
Home Profile Input                Task Assignment Decision
─────────────────                ────────────────────────

homeType: "condo"         ──>    Exterior tasks: EXCLUDED
                                 (No gutters, roof, deck, sprinklers)

homeType: "single_family" ──>    Exterior tasks: INCLUDED
                                 (Full gutter, roof, pressure wash)

hvacType: "central_air"   ──>    HVAC tasks: INCLUDED
                                 (Filter change, annual service)

hvacType: "none"          ──>    HVAC tasks: EXCLUDED

waterHeaterType: "tank"   ──>    Water heater tasks: INCLUDED
                                 (Flush, anode rod check)

waterHeaterType: "tankless" ─>   Tank-specific tasks: EXCLUDED

roofAgeYears: > 10        ──>    Roof inspection: HIGH priority
                                 Due in 30 days

roofAgeYears: < 10        ──>    Roof inspection: MEDIUM priority
                                 Due in 90 days
```

### Daily Reminder Flow

```
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│ node-cron       │────>│ processReminderQueue()│────>│ storage.            │
│ 9 AM EST Daily  │     │ (server/lib/cron.ts)  │     │ getPendingReminders │
└─────────────────┘     └───────────────────────┘     └──────────┬──────────┘
                                                                  │
                        ┌─────────────────────────────────────────┘
                        ▼
        ┌───────────────────────────────────────┐
        │ For each pending reminder:            │
        │                                       │
        │ 1. Get household contact info         │
        │ 2. Generate ICS calendar attachment   │
        │ 3. Send email via SendGrid            │
        │ 4. Send SMS via Twilio (if opted in)  │
        │ 5. Update reminder status             │
        │ 6. Log event to database              │
        └───────────────────────────────────────┘
```

### Task Completion Flow

```
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
│ User Marks      │────>│ POST /api/households/ │────>│ Validate:           │
│ Task Complete   │     │ {id}/maintenance-logs │     │ - Auth required     │
└─────────────────┘     └───────────────────────┘     │ - Date not future   │
                                                      │ - Appliance exists   │
                                                      └──────────┬──────────┘
                                                                 │
                        ┌────────────────────────────────────────┘
                        ▼
        ┌───────────────────────────────────────┐
        │ Create maintenance_logs entry:        │
        │                                       │
        │ - householdId                         │
        │ - taskAssignmentId (if scheduled)     │
        │ - applianceId (if applicable)         │
        │ - maintenanceDate                     │
        │ - taskPerformed                       │
        │ - logType (scheduled/manual/emergency)│
        │ - cost (optional)                     │
        │ - serviceProvider (optional)          │
        └───────────────────────────────────────┘
```

---

## 4. API Endpoints

### Task Management

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/households/:id/tasks` | Get household tasks | Required |
| POST | `/api/setup/activate` | Activate household + generate tasks | Token |

### Maintenance Logs

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/households/:id/maintenance-logs` | Create maintenance log | Required |
| GET | `/api/households/:id/maintenance-logs` | List logs with filters | Required |
| GET | `/api/households/:id/maintenance-logs/:logId` | Get single log | Required |
| PATCH | `/api/households/:id/maintenance-logs/:logId` | Update log | Required |
| DELETE | `/api/households/:id/maintenance-logs/:logId` | Delete log | Required |

### Reports

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/households/:id/reports/maintenance-history` | Maintenance history report | Required |
| GET | `/api/households/:id/reports/warranty-status` | Warranty status report | Required |

### Calendar Integration

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/calendar/google/auth-url` | Get OAuth URL | None |
| GET | `/api/calendar/google/callback` | OAuth callback | None |
| POST | `/api/calendar/sync` | Sync tasks to calendar | None |

### Request/Response Examples

#### Create Maintenance Log
```http
POST /api/households/abc123/maintenance-logs
Authorization: Bearer <token>
Content-Type: application/json

{
  "maintenanceDate": "2024-12-15",
  "taskPerformed": "Changed HVAC filter",
  "logType": "scheduled",
  "cost": 25.99,
  "serviceProvider": "DIY",
  "applianceId": "appliance-uuid",
  "notes": "Used MERV-13 filter"
}
```

Response:
```json
{
  "id": "log-uuid",
  "householdId": "abc123",
  "maintenanceDate": "2024-12-15T00:00:00.000Z",
  "taskPerformed": "Changed HVAC filter",
  "logType": "scheduled",
  "cost": "25.99",
  "createdAt": "2024-12-15T10:30:00.000Z"
}
```

#### Get Maintenance Logs with Filters
```http
GET /api/households/abc123/maintenance-logs?start_date=2024-01-01&end_date=2024-12-31&log_type=scheduled&page=1&page_size=25
Authorization: Bearer <token>
```

Response:
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalLogs": 42,
    "totalPages": 2
  },
  "summary": {
    "totalCost": 1250.50,
    "scheduledCount": 30,
    "manualCount": 8,
    "emergencyCount": 4,
    "onTimeCompletionRate": 0.85
  }
}
```

---

## 5. Frontend Components

### Task-Related Pages

| Component | Location | Purpose |
|-----------|----------|---------|
| `TaskDetail` | `client/src/pages/TaskDetail.tsx` | View task details, book professional |
| `Dashboard` | `client/src/pages/Dashboard.tsx` | Homeowner dashboard with upcoming tasks |
| `Appliances` | `client/src/pages/Appliances.tsx` | Manage household appliances |
| `AddAppliance` | `client/src/pages/AddAppliance.tsx` | Register new appliance |

### Key Component Features

#### TaskDetail.tsx
- Displays task name, description, priority, frequency
- "Do It Yourself" button with step-by-step guide
- "Book a Professional" form with service selection
- Submits leads via `/api/leads` endpoint

#### Dashboard.tsx
- Shows upcoming maintenance tasks
- Displays task due dates and priorities
- Links to task detail pages
- Shows appliance warranty status

### Component Props

```typescript
// TaskDetail displays task information
interface TaskDetailProps {
  taskName: string;
  description: string;
  frequencyMonths: number;
  priority: number; // 1=high, 2=medium, 3=low
}

// MaintenanceLog entry
interface MaintenanceLogEntry {
  id: string;
  maintenanceDate: Date;
  taskPerformed: string;
  logType: 'scheduled' | 'manual' | 'emergency';
  cost?: number;
  applianceType?: string;
}
```

---

## 6. Background Jobs

### Daily Reminder Job

```
Location: server/lib/cron.ts

Schedule: '0 9 * * *' (9:00 AM daily)
Timezone: America/New_York

Process:
1. Fetch pending reminders where run_at <= now
2. For each reminder:
   a. Get household contact info
   b. Generate ICS calendar attachment
   c. Send email via SendGrid (if email available)
   d. Send SMS via Twilio (if opted in + phone available)
   e. Update reminder status (sent/failed)
   f. Create audit event
```

### Manual Trigger

```typescript
import { triggerReminderProcessing } from './lib/cron';

// Manually run reminder queue processing
await triggerReminderProcessing();
```

---

## 7. Current Limitations

### Not Implemented

1. **Recurring Task Auto-Regeneration**: When a task is completed, a new occurrence is not automatically created for the next cycle
2. **Task Snooze/Reschedule**: Users cannot postpone tasks to a later date
3. **Custom Task Creation**: Users cannot create their own custom maintenance tasks
4. **Multi-Property Support**: System assumes one property per household
5. **Professional Provider Matching**: Booking requests go to leads table, not directly matched to providers
6. **Push Notifications**: Only email/SMS notifications, no browser push
7. **Task Dependencies**: No support for tasks that depend on completion of other tasks

### Known Issues

1. **Calendar Sync Household ID**: Currently uses test household ID instead of authenticated user's household
2. **ICS Attachments**: Calendar attachments may not work in all email clients
3. **Timezone Handling**: Reminders run at 9 AM EST; no per-household timezone support
4. **Mock Task Data**: TaskDetail page uses mock data instead of fetching from API

### Missing Endpoints

1. `PUT /api/households/:id/tasks/:taskId/complete` - Mark task as complete
2. `PUT /api/households/:id/tasks/:taskId/skip` - Skip a task
3. `POST /api/households/:id/tasks/:taskId/reschedule` - Reschedule task

---

## 8. Code Examples

### Generate Tasks Programmatically

```typescript
import { generateMaintenanceTasks } from './lib/tasks';
import { db } from './db';

// Must be called within a transaction
await db.transaction(async (tx) => {
  const homeProfile = {
    homeType: 'single_family',
    hvacType: 'central_air',
    waterHeaterType: 'tank_gas',
    roofAgeYears: 15,
    squareFootage: 2500
  };
  
  const tasks = await generateMaintenanceTasks(
    tx,
    'household-uuid',
    homeProfile
  );
  
  console.log(`Generated ${tasks.length} tasks`);
});
```

### Query Upcoming Tasks

```typescript
import { getUpcomingTasks } from './lib/tasks';
import { db } from './db';

// Get tasks due in next 30 days
const upcomingTasks = await getUpcomingTasks(
  db,
  'household-uuid',
  30 // days ahead
);

for (const task of upcomingTasks) {
  console.log(`${task.task.taskName} due ${task.assignment.dueDate}`);
}
```

### Create Maintenance Log via API

```typescript
// Frontend component example
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

const createLogMutation = useMutation({
  mutationFn: async (data: InsertMaintenanceLog) => {
    const response = await apiRequest(
      'POST',
      `/api/households/${householdId}/maintenance-logs`,
      data
    );
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: ['/api/households', householdId, 'maintenance-logs'] 
    });
  }
});
```

### SQL Queries

```sql
-- Get household's upcoming tasks with task details
SELECT 
  hta.id,
  hta.due_date,
  hta.status,
  hta.priority,
  hmt.task_name,
  hmt.category,
  hmt.description
FROM household_task_assignments hta
JOIN home_maintenance_tasks hmt ON hta.task_id = hmt.id
WHERE hta.household_id = 'household-uuid'
  AND hta.status = 'pending'
  AND hta.due_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY hta.due_date ASC;

-- Get maintenance cost summary by month
SELECT 
  DATE_TRUNC('month', maintenance_date) as month,
  COUNT(*) as event_count,
  SUM(CAST(cost AS DECIMAL)) as total_cost
FROM maintenance_logs
WHERE household_id = 'household-uuid'
  AND maintenance_date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', maintenance_date)
ORDER BY month DESC;

-- Get appliances with expiring warranties (next 14 days)
SELECT 
  id,
  appliance_type,
  brand,
  warranty_expiration,
  (warranty_expiration - CURRENT_DATE) as days_remaining
FROM household_appliances
WHERE household_id = 'household-uuid'
  AND is_active = true
  AND warranty_expiration IS NOT NULL
  AND warranty_expiration BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
ORDER BY warranty_expiration ASC;
```

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database schema definitions |
| `server/lib/tasks.ts` | Task generation logic |
| `server/lib/cron.ts` | Daily reminder job |
| `server/lib/mail.ts` | Email sending via SendGrid |
| `server/lib/ics.ts` | Calendar event generation |
| `server/lib/calendarSync.ts` | Google Calendar sync |
| `server/src/routes/maintenanceLogs.ts` | Maintenance log CRUD |
| `server/src/routes/reports.ts` | Maintenance history & warranty reports |
| `server/src/routes/calendar.ts` | Calendar OAuth & sync endpoints |
| `server/src/routes/setup.ts` | Household activation (triggers task gen) |
| `client/src/pages/TaskDetail.tsx` | Task detail view |
| `client/src/pages/Dashboard.tsx` | Homeowner dashboard |

---

*Last Updated: December 2024*

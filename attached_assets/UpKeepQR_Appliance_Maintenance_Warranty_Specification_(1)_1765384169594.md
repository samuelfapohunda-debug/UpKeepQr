# UpKeepQR Enhancement Specification
## Maintenance Log + Appliance Tracking + Warranty Management

**Version:** 1.0  
**Date:** December 9, 2025  
**Status:** Ready for Implementation

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [User Workflows](#user-workflows)
6. [Business Logic](#business-logic)
7. [Integration Points](#integration-points)
8. [Implementation Checklist](#implementation-checklist)
9. [Testing Scenarios](#testing-scenarios)
10. [Phase 2 Features](#phase-2-features)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Overview
This specification adds appliance tracking, maintenance logging, and warranty management to UpKeepQR, enabling homeowners to:
- Track major appliances with model/serial numbers
- Automatically log completed maintenance tasks
- Manually add ad-hoc maintenance entries
- Monitor warranty expirations with alerts
- Generate comprehensive maintenance history reports
- Sync warranty expiration dates to Google Calendar

### 1.2 Scope
**Phase 1 (This Specification):**
- Appliance management (CRUD operations)
- Maintenance log tracking (auto + manual)
- Warranty tracking with 14-day expiration alerts
- Maintenance history reports (filterable, exportable)
- Calendar integration for warranty dates
- Cost tracking and trend analysis

**Phase 2 (Future):**
- Service professional access to log maintenance
- PDF warranty document upload
- Advanced analytics and predictive maintenance

### 1.3 Non-Breaking Changes Guarantee
All new features are **additive only**:
- New database tables (no modifications to existing tables)
- New API endpoints (no changes to existing endpoints)
- New frontend components (existing pages unchanged unless specified)
- All new fields are optional during setup

---

## 2. DATABASE SCHEMA

### 2.1 New Tables

#### Table: `household_appliances`
Stores appliance information for each household.

```sql
CREATE TABLE household_appliances (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id VARCHAR NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  
  -- Basic Information (Required)
  appliance_type VARCHAR(100) NOT NULL, -- HVAC, Water Heater, Furnace, etc.
  brand VARCHAR(100) NOT NULL,
  model_number VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  purchase_date DATE NOT NULL,
  
  -- Optional Information
  purchase_price DECIMAL(10, 2),
  installation_date DATE,
  location VARCHAR(200), -- "Upstairs", "Basement", "Kitchen", etc.
  notes TEXT,
  
  -- Warranty Information
  warranty_type VARCHAR(50), -- "Manufacturer", "Extended", "Labor"
  warranty_expiration DATE,
  warranty_provider VARCHAR(100),
  warranty_policy_number VARCHAR(100),
  warranty_coverage_details TEXT,
  
  -- System Fields
  warranty_alert_sent BOOLEAN DEFAULT FALSE,
  warranty_alert_sent_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50), -- "customer" or "admin"
  created_by_user_id VARCHAR REFERENCES households(id),
  
  CONSTRAINT unique_appliance_serial UNIQUE(serial_number)
);

CREATE INDEX idx_household_appliances_household ON household_appliances(household_id);
CREATE INDEX idx_household_appliances_type ON household_appliances(appliance_type);
CREATE INDEX idx_household_appliances_warranty_exp ON household_appliances(warranty_expiration);
CREATE INDEX idx_household_appliances_active ON household_appliances(is_active);
```

#### Table: `maintenance_logs`
Records all maintenance activities (auto-generated from completed tasks + manual entries).

```sql
CREATE TABLE maintenance_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id VARCHAR NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  
  -- Link to Task (if from scheduled maintenance)
  task_assignment_id VARCHAR REFERENCES household_task_assignments(id) ON DELETE SET NULL,
  
  -- Link to Appliance (if applicable)
  appliance_id VARCHAR REFERENCES household_appliances(id) ON DELETE SET NULL,
  
  -- Core Information (Required)
  maintenance_date DATE NOT NULL,
  task_performed TEXT NOT NULL,
  log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('scheduled', 'manual', 'emergency')),
  
  -- Optional Details
  cost DECIMAL(10, 2),
  service_provider VARCHAR(200),
  parts_replaced TEXT,
  notes TEXT,
  
  -- System Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50), -- "customer", "admin", "pro" (Phase 2)
  created_by_user_id VARCHAR,
  
  -- For scheduled tasks
  was_on_time BOOLEAN, -- Did they complete on/before due date?
  days_late INTEGER -- If late, how many days?
);

CREATE INDEX idx_maintenance_logs_household ON maintenance_logs(household_id);
CREATE INDEX idx_maintenance_logs_appliance ON maintenance_logs(appliance_id);
CREATE INDEX idx_maintenance_logs_task ON maintenance_logs(task_assignment_id);
CREATE INDEX idx_maintenance_logs_date ON maintenance_logs(maintenance_date);
CREATE INDEX idx_maintenance_logs_type ON maintenance_logs(log_type);
```

#### Table: `common_appliances`
Master list of common appliances with typical maintenance tasks.

```sql
CREATE TABLE common_appliances (
  id SERIAL PRIMARY KEY,
  appliance_type VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- HVAC, Plumbing, Kitchen, Laundry, etc.
  typical_lifespan_years INTEGER,
  common_brands TEXT[], -- Array of common brands
  maintenance_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-populate with common appliances
INSERT INTO common_appliances (appliance_type, category, typical_lifespan_years, common_brands) VALUES
  ('HVAC System', 'HVAC', 15, ARRAY['Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman']),
  ('Water Heater', 'Plumbing', 12, ARRAY['Rheem', 'AO Smith', 'Bradford White', 'Rinnai']),
  ('Furnace', 'HVAC', 20, ARRAY['Carrier', 'Trane', 'Lennox', 'Goodman']),
  ('Central Air Conditioner', 'HVAC', 15, ARRAY['Carrier', 'Trane', 'Lennox', 'Rheem']),
  ('Refrigerator', 'Kitchen', 13, ARRAY['Samsung', 'LG', 'Whirlpool', 'GE', 'Frigidaire']),
  ('Dishwasher', 'Kitchen', 10, ARRAY['Bosch', 'KitchenAid', 'Whirlpool', 'Samsung', 'LG']),
  ('Washing Machine', 'Laundry', 11, ARRAY['LG', 'Samsung', 'Whirlpool', 'Maytag', 'GE']),
  ('Dryer', 'Laundry', 13, ARRAY['LG', 'Samsung', 'Whirlpool', 'Maytag', 'GE']),
  ('Oven/Range', 'Kitchen', 15, ARRAY['GE', 'Whirlpool', 'Samsung', 'LG', 'Frigidaire']),
  ('Garbage Disposal', 'Kitchen', 12, ARRAY['InSinkErator', 'Waste King', 'Moen']),
  ('Sump Pump', 'Plumbing', 10, ARRAY['Wayne', 'Zoeller', 'Superior Pump']);
```

### 2.2 Schema Updates (TypeScript)

Add to `shared/schema.ts`:

```typescript
// Household Appliances Table
export const householdAppliancesTable = pgTable('household_appliances', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  household_id: text('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  
  // Basic Information
  appliance_type: varchar('appliance_type', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model_number: varchar('model_number', { length: 100 }).notNull(),
  serial_number: varchar('serial_number', { length: 100 }).notNull(),
  purchase_date: date('purchase_date').notNull(),
  
  // Optional Information
  purchase_price: decimal('purchase_price', { precision: 10, scale: 2 }),
  installation_date: date('installation_date'),
  location: varchar('location', { length: 200 }),
  notes: text('notes'),
  
  // Warranty Information
  warranty_type: varchar('warranty_type', { length: 50 }),
  warranty_expiration: date('warranty_expiration'),
  warranty_provider: varchar('warranty_provider', { length: 100 }),
  warranty_policy_number: varchar('warranty_policy_number', { length: 100 }),
  warranty_coverage_details: text('warranty_coverage_details'),
  
  // System Fields
  warranty_alert_sent: boolean('warranty_alert_sent').default(false),
  warranty_alert_sent_at: timestamp('warranty_alert_sent_at'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: varchar('created_by', { length: 50 }),
  created_by_user_id: text('created_by_user_id'),
});

// Maintenance Logs Table
export const maintenanceLogsTable = pgTable('maintenance_logs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  household_id: text('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  task_assignment_id: text('task_assignment_id').references(() => householdTaskAssignmentsTable.id, { onDelete: 'set null' }),
  appliance_id: text('appliance_id').references(() => householdAppliancesTable.id, { onDelete: 'set null' }),
  
  // Core Information
  maintenance_date: date('maintenance_date').notNull(),
  task_performed: text('task_performed').notNull(),
  log_type: varchar('log_type', { length: 20 }).notNull(),
  
  // Optional Details
  cost: decimal('cost', { precision: 10, scale: 2 }),
  service_provider: varchar('service_provider', { length: 200 }),
  parts_replaced: text('parts_replaced'),
  notes: text('notes'),
  
  // System Fields
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: varchar('created_by', { length: 50 }),
  created_by_user_id: text('created_by_user_id'),
  
  // Compliance Tracking
  was_on_time: boolean('was_on_time'),
  days_late: integer('days_late'),
});

// Common Appliances Table
export const commonAppliancesTable = pgTable('common_appliances', {
  id: serial('id').primaryKey(),
  appliance_type: varchar('appliance_type', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(),
  typical_lifespan_years: integer('typical_lifespan_years'),
  common_brands: text('common_brands').array(),
  maintenance_notes: text('maintenance_notes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Type exports
export type HouseholdAppliance = typeof householdAppliancesTable.$inferSelect;
export type InsertHouseholdAppliance = typeof householdAppliancesTable.$inferInsert;
export type MaintenanceLog = typeof maintenanceLogsTable.$inferSelect;
export type InsertMaintenanceLog = typeof maintenanceLogsTable.$inferInsert;
export type CommonAppliance = typeof commonAppliancesTable.$inferSelect;
```

---

## 3. API ENDPOINTS

### 3.1 Appliance Management

#### POST `/api/households/:householdId/appliances`
Create a new appliance for a household.

**Request Body:**
```json
{
  "appliance_type": "HVAC System",
  "brand": "Carrier",
  "model_number": "24ACC636A003",
  "serial_number": "4219A00123",
  "purchase_date": "2020-05-15",
  "purchase_price": 5500.00,
  "installation_date": "2020-06-01",
  "location": "Upstairs",
  "notes": "Installed by ABC HVAC Services",
  "warranty_type": "Extended",
  "warranty_expiration": "2027-06-01",
  "warranty_provider": "HomeGuard Warranty",
  "warranty_policy_number": "HG-2020-12345",
  "warranty_coverage_details": "Full parts and labor coverage"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "household_id": "household-uuid",
  "appliance_type": "HVAC System",
  ...
  "created_at": "2025-12-09T..."
}
```

**Authentication:** Homeowner (own household) or Admin  
**Validation:**
- Required fields: appliance_type, brand, model_number, serial_number, purchase_date
- Serial number must be unique across system
- Purchase date cannot be in future
- Warranty expiration must be after purchase date (if provided)

---

#### GET `/api/households/:householdId/appliances`
Get all appliances for a household.

**Query Parameters:**
- `is_active` (boolean, optional): Filter by active status (default: true)
- `appliance_type` (string, optional): Filter by type

**Response:** `200 OK`
```json
{
  "appliances": [
    {
      "id": "uuid",
      "appliance_type": "HVAC System",
      "brand": "Carrier",
      "model_number": "24ACC636A003",
      "serial_number": "4219A00123",
      "location": "Upstairs",
      "warranty_expiration": "2027-06-01",
      "warranty_days_remaining": 547,
      "is_warranty_expiring_soon": false,
      ...
    }
  ],
  "total": 5,
  "warranties_expiring_soon": 1
}
```

---

#### GET `/api/households/:householdId/appliances/:applianceId`
Get details of a specific appliance.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "household_id": "household-uuid",
  "appliance_type": "HVAC System",
  "brand": "Carrier",
  "model_number": "24ACC636A003",
  "serial_number": "4219A00123",
  "purchase_date": "2020-05-15",
  "purchase_price": 5500.00,
  "installation_date": "2020-06-01",
  "location": "Upstairs",
  "warranty_expiration": "2027-06-01",
  "warranty_days_remaining": 547,
  "is_warranty_expiring_soon": false,
  "maintenance_logs_count": 12,
  "last_maintenance_date": "2025-11-15",
  "total_maintenance_cost": 850.00,
  ...
}
```

---

#### PATCH `/api/households/:householdId/appliances/:applianceId`
Update appliance information.

**Request Body:** (All fields optional)
```json
{
  "location": "Main Floor",
  "notes": "Updated location after home remodel",
  "warranty_expiration": "2028-06-01"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "updated_at": "2025-12-09T...",
  ...
}
```

---

#### DELETE `/api/households/:householdId/appliances/:applianceId`
Soft delete an appliance (sets `is_active = false`).

**Response:** `204 No Content`

**Note:** Maintenance logs remain intact, but appliance is hidden from active listings.

---

#### GET `/api/common-appliances`
Get list of common appliances for selection dropdown.

**Query Parameters:**
- `category` (string, optional): Filter by category

**Response:** `200 OK`
```json
{
  "appliances": [
    {
      "id": 1,
      "appliance_type": "HVAC System",
      "category": "HVAC",
      "typical_lifespan_years": 15,
      "common_brands": ["Carrier", "Trane", "Lennox", "Rheem", "Goodman"]
    },
    ...
  ]
}
```

---

### 3.2 Maintenance Logs

#### POST `/api/households/:householdId/maintenance-logs`
Create a manual maintenance log entry.

**Request Body:**
```json
{
  "appliance_id": "appliance-uuid",
  "maintenance_date": "2025-12-09",
  "task_performed": "Replaced air filter and cleaned coils",
  "log_type": "manual",
  "cost": 150.00,
  "service_provider": "ABC HVAC Services",
  "parts_replaced": "HEPA air filter (Filtrete 1900)",
  "notes": "Technician recommended annual deep cleaning"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "household_id": "household-uuid",
  "maintenance_date": "2025-12-09",
  ...
}
```

**Authentication:** Homeowner (own household) or Admin

---

#### GET `/api/households/:householdId/maintenance-logs`
Get maintenance logs for a household (with filtering).

**Query Parameters:**
- `start_date` (ISO date, optional): Filter logs from this date
- `end_date` (ISO date, optional): Filter logs to this date
- `appliance_id` (uuid, optional): Filter by specific appliance
- `log_type` (string, optional): Filter by type (scheduled, manual, emergency)
- `page` (integer, default: 1): Pagination
- `page_size` (integer, default: 25): Results per page
- `sort_by` (string, default: maintenance_date): Sort field
- `sort_dir` (string, default: desc): Sort direction

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": "uuid",
      "household_id": "household-uuid",
      "appliance_id": "appliance-uuid",
      "appliance_type": "HVAC System",
      "appliance_location": "Upstairs",
      "maintenance_date": "2025-12-09",
      "task_performed": "Replaced air filter",
      "log_type": "scheduled",
      "cost": 150.00,
      "service_provider": "ABC HVAC",
      "was_on_time": true,
      "days_late": 0,
      "created_at": "2025-12-09T..."
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total_logs": 45,
    "total_pages": 2
  },
  "summary": {
    "total_cost": 3750.00,
    "scheduled_count": 30,
    "manual_count": 15,
    "on_time_completion_rate": 0.87
  }
}
```

---

#### GET `/api/households/:householdId/maintenance-logs/:logId`
Get details of a specific maintenance log.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "household_id": "household-uuid",
  "task_assignment_id": "task-uuid",
  "appliance_id": "appliance-uuid",
  "appliance_details": {
    "appliance_type": "HVAC System",
    "brand": "Carrier",
    "model_number": "24ACC636A003",
    "location": "Upstairs"
  },
  "maintenance_date": "2025-12-09",
  "task_performed": "Replaced air filter",
  "log_type": "scheduled",
  "cost": 150.00,
  "was_on_time": true,
  ...
}
```

---

#### PATCH `/api/households/:householdId/maintenance-logs/:logId`
Update a maintenance log entry.

**Request Body:** (All fields optional)
```json
{
  "cost": 175.00,
  "notes": "Added extra coil cleaning service"
}
```

**Response:** `200 OK`

---

#### DELETE `/api/households/:householdId/maintenance-logs/:logId`
Delete a maintenance log (hard delete, only for manual logs).

**Response:** `204 No Content`

**Note:** Cannot delete logs auto-generated from scheduled tasks.

---

### 3.3 Maintenance History Reports

#### GET `/api/households/:householdId/reports/maintenance-history`
Generate comprehensive maintenance history report.

**Query Parameters:**
- `start_date` (ISO date, optional): Report start date
- `end_date` (ISO date, optional): Report end date
- `appliance_id` (uuid, optional): Filter by appliance
- `format` (string, default: json): Response format (json, pdf)
- `include_charts` (boolean, default: false): Include chart data

**Response:** `200 OK`
```json
{
  "household": {
    "id": "household-uuid",
    "name": "John Smith",
    "address": "123 Main St, City, ST 12345"
  },
  "report_period": {
    "start_date": "2024-01-01",
    "end_date": "2025-12-09"
  },
  "summary": {
    "total_maintenance_events": 45,
    "scheduled_tasks_completed": 30,
    "manual_logs_added": 15,
    "total_cost": 3750.00,
    "average_cost_per_event": 83.33,
    "on_time_completion_rate": 0.87,
    "appliances_serviced": 8
  },
  "by_appliance": [
    {
      "appliance_id": "uuid",
      "appliance_type": "HVAC System",
      "location": "Upstairs",
      "maintenance_count": 12,
      "total_cost": 1800.00,
      "last_maintenance_date": "2025-11-15"
    },
    ...
  ],
  "cost_trend": [
    {
      "month": "2025-01",
      "total_cost": 325.00,
      "event_count": 4
    },
    ...
  ],
  "compliance": {
    "scheduled_tasks_total": 35,
    "completed_on_time": 30,
    "completed_late": 3,
    "skipped": 2,
    "compliance_rate": 0.857
  },
  "logs": [
    {
      "date": "2025-12-09",
      "appliance_type": "HVAC System",
      "task": "Filter replacement",
      "cost": 150.00,
      "was_on_time": true
    },
    ...
  ],
  "generated_at": "2025-12-09T19:45:00Z"
}
```

---

#### GET `/api/households/:householdId/reports/warranty-status`
Get warranty status report for all appliances.

**Response:** `200 OK`
```json
{
  "summary": {
    "total_appliances": 8,
    "under_warranty": 5,
    "warranty_expired": 2,
    "no_warranty": 1,
    "expiring_soon_14_days": 1
  },
  "expiring_soon": [
    {
      "appliance_id": "uuid",
      "appliance_type": "Water Heater",
      "brand": "Rheem",
      "warranty_expiration": "2025-12-20",
      "days_remaining": 11,
      "warranty_provider": "Rheem Manufacturing"
    }
  ],
  "under_warranty": [
    {
      "appliance_id": "uuid",
      "appliance_type": "HVAC System",
      "warranty_expiration": "2027-06-01",
      "days_remaining": 547
    },
    ...
  ],
  "expired": [
    {
      "appliance_id": "uuid",
      "appliance_type": "Refrigerator",
      "warranty_expiration": "2023-08-15",
      "days_expired": 847
    },
    ...
  ]
}
```

---

### 3.4 Calendar Integration

#### POST `/api/households/:householdId/calendar/sync-warranties`
Sync warranty expiration dates to connected Google Calendar.

**Request Body:** (optional)
```json
{
  "appliance_ids": ["uuid1", "uuid2"] // If not provided, syncs all
}
```

**Response:** `200 OK`
```json
{
  "synced_count": 5,
  "skipped_count": 2,
  "events_created": [
    {
      "appliance_id": "uuid",
      "appliance_type": "HVAC System",
      "warranty_expiration": "2027-06-01",
      "google_event_id": "google-event-id"
    },
    ...
  ],
  "errors": []
}
```

**Requirements:**
- User must have connected Google Calendar
- Creates all-day events on warranty expiration date
- Event title: "Warranty Expires: [Appliance Type] - [Brand]"
- Event description includes appliance details and warranty info
- Sets reminder 14 days before expiration

---

## 4. FRONTEND COMPONENTS

### 4.1 Setup Form Enhancements

#### Component: `ApplianceSetupSection` (New)
**Location:** `client/src/components/setup/ApplianceSetupSection.tsx`

**Features:**
- Optional collapsible section in household setup form
- "Add Appliance" button opens modal
- Shows list of added appliances with edit/remove options
- Integrates with common appliances dropdown

**Fields per appliance:**
- Appliance Type (dropdown with autocomplete from common_appliances)
- Brand (text input, optional autocomplete from common brands)
- Model Number (text)
- Serial Number (text)
- Purchase Date (date picker)
- Purchase Price (currency input, optional)
- Installation Date (date picker, optional)
- Location (text, e.g., "Upstairs", "Kitchen")
- Warranty Type (dropdown: Manufacturer, Extended, Labor)
- Warranty Expiration (date picker, optional)
- Warranty Provider (text, optional)
- Policy Number (text, optional)
- Coverage Details (textarea, optional)

**Validation:**
- Required: Appliance Type, Brand, Model, Serial, Purchase Date
- Serial number uniqueness check via API
- Purchase date cannot be in future
- Warranty expiration must be after purchase date

---

### 4.2 Household Dashboard Enhancements

#### Component: `ApplianceManagementPage` (New)
**Location:** `client/src/pages/household/ApplianceManagementPage.tsx`

**Features:**
- Grid/list view of all household appliances
- Filterable by appliance type, warranty status
- Sortable by purchase date, warranty expiration
- Visual indicators for:
  - ⚠️ Warranty expiring within 14 days
  - ❌ Warranty expired
  - ✅ Under warranty
  - ℹ️ No warranty information
- Quick actions: Edit, View Details, Add Maintenance Log, Delete
- "Add New Appliance" button (opens modal)

**Card Display (per appliance):**
```
┌─────────────────────────────────────────┐
│ 🏠 HVAC System - Carrier                │
│ Model: 24ACC636A003                     │
│ Location: Upstairs                       │
│ ✅ Warranty: Expires Jun 1, 2027 (547d) │
│ Last Maintenance: Nov 15, 2025          │
│ [View] [Edit] [Log Maintenance]         │
└─────────────────────────────────────────┘
```

---

#### Component: `ApplianceDetailsModal` (New)
**Location:** `client/src/components/household/ApplianceDetailsModal.tsx`

**Tabs:**
1. **Overview:** All appliance details (editable)
2. **Warranty:** Warranty information, countdown timer, sync to calendar button
3. **Maintenance History:** Filtered maintenance logs for this appliance
4. **Documents:** Phase 2 - Document uploads

---

#### Component: `MaintenanceLogPage` (New)
**Location:** `client/src/pages/household/MaintenanceLogPage.tsx`

**Features:**
- Timeline view of all maintenance activities
- Filter panel:
  - Date range picker
  - Appliance selector (multi-select)
  - Log type (scheduled, manual, emergency)
  - Cost range slider
- "Add Manual Log" button (opens modal)
- Export options: PDF, CSV
- Summary cards at top:
  - Total Maintenance Events
  - Total Cost (current period)
  - Average Cost per Event
  - On-Time Completion Rate

**Timeline Entry Example:**
```
┌────────────────────────────────────────────┐
│ Dec 9, 2025 • HVAC System (Upstairs)       │
│ ✅ Filter Replacement (Scheduled)          │
│ Cost: $150 • Provider: ABC HVAC            │
│ Parts: HEPA filter (Filtrete 1900)        │
│ ⏱️ Completed on time                       │
│ [View Details] [Edit]                      │
└────────────────────────────────────────────┘
```

---

#### Component: `AddMaintenanceLogModal` (New)
**Location:** `client/src/components/household/AddMaintenanceLogModal.tsx`

**Fields:**
- Appliance (dropdown, optional if not appliance-specific)
- Maintenance Date (date picker, default: today)
- Task Performed (textarea, required)
- Log Type (dropdown: Manual, Emergency)
- Cost (currency input, optional)
- Service Provider (text, optional)
- Parts Replaced (textarea, optional)
- Notes (textarea, optional)

**Validation:**
- Required: Maintenance Date, Task Performed
- Date cannot be in future
- Cost must be positive if provided

---

#### Component: `MaintenanceHistoryReport` (New)
**Location:** `client/src/pages/household/MaintenanceHistoryReport.tsx`

**Features:**
- Date range selector (preset options: Last 30 days, Last 6 months, Last year, All time, Custom)
- Appliance filter (multi-select)
- Visual report sections:
  1. **Summary Cards:**
     - Total Maintenance Events
     - Total Cost
     - Average Cost per Event
     - On-Time Completion Rate
  2. **Cost Trend Chart:** Line chart showing monthly costs
  3. **Maintenance by Appliance:** Bar chart
  4. **Compliance Chart:** Pie chart (On Time vs. Late vs. Skipped)
  5. **Detailed Table:** Sortable, filterable table of all logs
- Export buttons: 
  - "Export PDF" (generates formatted PDF report)
  - "Export CSV" (raw data export)
  - "Print" (browser print dialog)

---

### 4.3 Task Completion Enhancements

#### Component: `TaskCompletionModal` (Enhanced)
**Location:** `client/src/components/household/TaskCompletionModal.tsx`

**New Features:**
- After marking task as complete, show optional "Log Details" section:
  - Linked Appliance (dropdown, pre-filled if task is linked to appliance)
  - Cost (currency input, optional)
  - Service Provider (text, optional)
  - Parts Replaced (textarea, optional)
  - Notes (textarea, optional)
- "Skip Logging" button (still creates basic log entry)
- "Save & Log Details" button (creates detailed log entry)

**API Behavior:**
- When task marked complete → auto-creates maintenance_log with basic info
- If user adds details → updates the log entry with additional information
- Calculates `was_on_time` and `days_late` based on due date vs. completion date

---

### 4.4 Admin Dashboard Enhancements

#### Component: `AdminApplianceOverview` (New)
**Location:** `client/src/pages/admin/ApplianceOverview.tsx`

**Features:**
- System-wide appliance statistics
- Warranty expiration calendar
- Most common appliances report
- Maintenance cost trends across all households
- Appliance lifecycle analysis

---

## 5. USER WORKFLOWS

### 5.1 Add Appliance During Setup

```
User Journey:
1. User scans QR code → Setup form loads
2. User fills Personal Details → Next
3. User fills Home Details → Next
4. User reaches "Appliances" section (optional, collapsible)
5. User clicks "Add Appliance"
6. Modal opens with appliance form
7. User selects "HVAC System" from dropdown (autocomplete)
   - Dropdown shows common brands: Carrier, Trane, Lennox, etc.
8. User fills: Brand, Model, Serial, Purchase Date
9. User optionally adds warranty info
10. Click "Save Appliance"
11. Appliance appears in list under section
12. User can add more appliances or proceed
13. Complete setup → Appliances saved to database

Backend Actions:
- Validate serial number uniqueness
- Create household record
- Create appliance records linked to household
- Send welcome email (existing flow)
```

---

### 5.2 Add Appliance After Setup (Dashboard)

```
User Journey:
1. User logs into household dashboard
2. Clicks "Appliances" in sidebar
3. Views current appliances list
4. Clicks "Add New Appliance" button
5. Modal opens with appliance form
6. User fills required fields + optional warranty info
7. Click "Save"
8. Appliance appears in list immediately
9. User can click "Sync to Calendar" to add warranty date

Backend Actions:
- Validate serial number uniqueness
- Create appliance record
- If warranty exists and user has connected calendar:
  - Optionally sync warranty expiration to Google Calendar
  - Create all-day event with 14-day reminder
```

---

### 5.3 Complete Scheduled Task with Maintenance Logging

```
User Journey:
1. User receives maintenance reminder (SMS/email)
2. User logs into dashboard → sees pending task
3. Clicks "Mark Complete" on task
4. Task Completion Modal opens:
   a. "Completed this task?" → Yes/No
   b. If Yes, "Add maintenance details?" section appears (optional):
      - Linked Appliance: [pre-filled if task has appliance link]
      - Cost: [optional]
      - Service Provider: [optional]
      - Parts Replaced: [optional]
      - Notes: [optional]
5. User has 2 options:
   - "Complete Task" (minimal logging)
   - "Complete & Log Details" (detailed logging)
6. Task marked complete, maintenance log created
7. If task was completed late → system calculates days late
8. User sees confirmation: "Task completed! View maintenance log"

Backend Actions:
- Update household_task_assignments: status = 'completed', completed_at = now()
- Create maintenance_logs entry:
  - task_assignment_id = task.id
  - appliance_id = [from task or user selection]
  - maintenance_date = completed_at
  - task_performed = task.task_name
  - log_type = 'scheduled'
  - was_on_time = (completed_at <= due_date)
  - days_late = (completed_at - due_date) if late
  - cost, service_provider, parts_replaced, notes from user input
- If Google Calendar connected:
  - Update calendar event status to "completed"
  - Add notes to calendar event
```

---

### 5.4 Add Manual Maintenance Log

```
User Journey:
1. User logs into dashboard
2. Clicks "Maintenance Log" in sidebar
3. Clicks "Add Manual Entry" button
4. Modal opens with form:
   - Appliance: [dropdown of household appliances]
   - Date: [date picker, default today]
   - Task Performed: [textarea]
   - Log Type: [Manual or Emergency]
   - Cost, Service Provider, Parts, Notes: [optional]
5. User fills form → Click "Save Log"
6. Log appears in timeline immediately
7. User sees confirmation with cost added to totals

Backend Actions:
- Validate maintenance date not in future
- Create maintenance_logs entry:
  - log_type = 'manual' or 'emergency'
  - task_assignment_id = null (not linked to scheduled task)
  - All other fields from user input
- Update household maintenance summary metrics
```

---

### 5.5 Generate Maintenance History Report

```
User Journey:
1. User logs into dashboard
2. Clicks "Reports" → "Maintenance History" in sidebar
3. Report page loads with filters:
   - Date Range: [dropdown: Last 30 days, Last 6 months, Last year, All time, Custom]
   - Appliances: [multi-select dropdown]
   - Apply Filters button
4. User selects "Last 6 months" → Clicks Apply
5. Report displays:
   - Summary cards with totals
   - Cost trend chart (monthly)
   - Maintenance by appliance bar chart
   - Compliance pie chart
   - Detailed table of all logs
6. User clicks "Export PDF"
7. PDF downloads with formatted report
8. User can also click "Print" for browser print

Backend Actions:
- Query maintenance_logs with filters
- Calculate summary statistics
- Aggregate by appliance, by month
- Calculate compliance metrics
- Generate JSON response
- Frontend renders charts and tables
- For PDF: frontend generates PDF using jsPDF or similar library
```

---

### 5.6 Warranty Expiration Alert & Calendar Sync

```
System Workflow (Automated):
1. Daily cron job runs at 6 AM
2. Query household_appliances where:
   - warranty_expiration BETWEEN today AND today+14 days
   - warranty_alert_sent = false
3. For each appliance:
   a. Send email to household owner:
      - Subject: "⚠️ Warranty Expiring Soon: [Appliance Type]"
      - Body: Details, expiration date, recommendation to renew
   b. If user has Google Calendar connected:
      - Check if warranty event already exists
      - If not, create all-day event on expiration date
      - Add 14-day and 1-day reminder
   c. Update warranty_alert_sent = true, warranty_alert_sent_at = now()
4. On expiration date (another cron job):
   - Send final reminder email
   - Update appliance warranty status in dashboard

User Action (Manual Sync):
1. User views appliance details
2. Sees warranty expiring in 10 days
3. Clicks "Sync to Calendar" button
4. System creates/updates Google Calendar event
5. User sees confirmation: "Warranty date added to calendar"
```

---

## 6. BUSINESS LOGIC

### 6.1 Maintenance Log Auto-Creation

**Trigger:** User marks scheduled task as complete

**Logic:**
```typescript
async function createMaintenanceLogFromTask(
  taskAssignment: HouseholdTaskAssignment,
  completedAt: Date,
  userDetails: {
    cost?: number;
    serviceProvider?: string;
    partsReplaced?: string;
    notes?: string;
  }
): Promise<MaintenanceLog> {
  
  // Calculate compliance
  const wasOnTime = completedAt <= taskAssignment.due_date;
  const daysLate = wasOnTime 
    ? 0 
    : Math.floor((completedAt.getTime() - taskAssignment.due_date.getTime()) / (1000 * 60 * 60 * 24));
  
  // Find linked appliance (if task has appliance association)
  const linkedAppliance = await findApplianceForTask(taskAssignment.task_id);
  
  // Create maintenance log
  const log = await db.insert(maintenanceLogsTable).values({
    id: randomUUID(),
    household_id: taskAssignment.household_id,
    task_assignment_id: taskAssignment.id,
    appliance_id: linkedAppliance?.id || null,
    maintenance_date: completedAt,
    task_performed: taskAssignment.task_name || "Scheduled maintenance task",
    log_type: 'scheduled',
    cost: userDetails.cost || null,
    service_provider: userDetails.serviceProvider || null,
    parts_replaced: userDetails.partsReplaced || null,
    notes: userDetails.notes || null,
    was_on_time: wasOnTime,
    days_late: daysLate,
    created_by: 'customer',
    created_by_user_id: taskAssignment.household_id,
  }).returning();
  
  // If calendar connected, update event
  if (await hasCalendarConnection(taskAssignment.household_id)) {
    await updateCalendarEventStatus(taskAssignment.id, 'completed');
  }
  
  return log[0];
}
```

---

### 6.2 Warranty Expiration Alert System

**Cron Job:** Daily at 6:00 AM server time

**Logic:**
```typescript
async function sendWarrantyExpirationAlerts() {
  const today = new Date();
  const fourteenDaysFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
  
  // Find appliances with warranties expiring in next 14 days
  const expiringAppliances = await db.select()
    .from(householdAppliancesTable)
    .where(
      and(
        gte(householdAppliancesTable.warranty_expiration, today),
        lte(householdAppliancesTable.warranty_expiration, fourteenDaysFromNow),
        eq(householdAppliancesTable.warranty_alert_sent, false),
        eq(householdAppliancesTable.is_active, true)
      )
    );
  
  for (const appliance of expiringAppliances) {
    try {
      // Get household details
      const household = await db.select()
        .from(householdsTable)
        .where(eq(householdsTable.id, appliance.household_id))
        .limit(1);
      
      if (!household[0]) continue;
      
      const daysRemaining = Math.floor(
        (appliance.warranty_expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Send email alert
      await sendWarrantyExpirationEmail({
        to: household[0].email,
        householdName: household[0].name,
        appliance: {
          type: appliance.appliance_type,
          brand: appliance.brand,
          model: appliance.model_number,
          location: appliance.location,
        },
        warrantyExpiration: appliance.warranty_expiration,
        daysRemaining,
        warrantyProvider: appliance.warranty_provider,
        policyNumber: appliance.warranty_policy_number,
      });
      
      // Sync to Google Calendar if connected
      const calendarConnection = await getCalendarConnection(appliance.household_id);
      if (calendarConnection) {
        await syncWarrantyToCalendar(appliance, calendarConnection);
      }
      
      // Mark alert as sent
      await db.update(householdAppliancesTable)
        .set({
          warranty_alert_sent: true,
          warranty_alert_sent_at: new Date(),
        })
        .where(eq(householdAppliancesTable.id, appliance.id));
      
      console.log(`✅ Warranty alert sent for appliance ${appliance.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to send warranty alert for appliance ${appliance.id}:`, error);
    }
  }
  
  console.log(`Warranty alert job complete: ${expiringAppliances.length} alerts sent`);
}
```

---

### 6.3 Cost Trend Analysis

**Function:** Calculate monthly cost trends for maintenance history report

**Logic:**
```typescript
async function calculateCostTrends(
  householdId: string,
  startDate: Date,
  endDate: Date
): Promise<CostTrend[]> {
  
  // Query maintenance logs in date range
  const logs = await db.select()
    .from(maintenanceLogsTable)
    .where(
      and(
        eq(maintenanceLogsTable.household_id, householdId),
        gte(maintenanceLogsTable.maintenance_date, startDate),
        lte(maintenanceLogsTable.maintenance_date, endDate)
      )
    );
  
  // Group by month
  const monthlyData = new Map<string, { total_cost: number; event_count: number }>();
  
  for (const log of logs) {
    const monthKey = log.maintenance_date.toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total_cost: 0, event_count: 0 });
    }
    
    const current = monthlyData.get(monthKey)!;
    current.total_cost += Number(log.cost || 0);
    current.event_count += 1;
  }
  
  // Convert to array and sort
  const trends: CostTrend[] = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      total_cost: data.total_cost,
      event_count: data.event_count,
      average_cost: data.total_cost / data.event_count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return trends;
}
```

---

### 6.4 Compliance Rate Calculation

**Function:** Calculate on-time completion rate for scheduled tasks

**Logic:**
```typescript
async function calculateComplianceRate(
  householdId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ComplianceMetrics> {
  
  let query = db.select()
    .from(maintenanceLogsTable)
    .where(
      and(
        eq(maintenanceLogsTable.household_id, householdId),
        eq(maintenanceLogsTable.log_type, 'scheduled'),
        isNotNull(maintenanceLogsTable.task_assignment_id)
      )
    );
  
  if (startDate) {
    query = query.where(gte(maintenanceLogsTable.maintenance_date, startDate));
  }
  if (endDate) {
    query = query.where(lte(maintenanceLogsTable.maintenance_date, endDate));
  }
  
  const logs = await query;
  
  const total = logs.length;
  const onTime = logs.filter(log => log.was_on_time).length;
  const late = logs.filter(log => !log.was_on_time).length;
  
  // Also get skipped tasks (assigned but not completed in date range)
  const skippedTasks = await db.select()
    .from(householdTaskAssignmentsTable)
    .where(
      and(
        eq(householdTaskAssignmentsTable.household_id, householdId),
        eq(householdTaskAssignmentsTable.status, 'skipped'),
        startDate ? gte(householdTaskAssignmentsTable.due_date, startDate) : sql`true`,
        endDate ? lte(householdTaskAssignmentsTable.due_date, endDate) : sql`true`
      )
    );
  
  const skipped = skippedTasks.length;
  const totalScheduled = total + skipped;
  
  return {
    scheduled_tasks_total: totalScheduled,
    completed_on_time: onTime,
    completed_late: late,
    skipped,
    compliance_rate: totalScheduled > 0 ? onTime / totalScheduled : 0,
    on_time_percentage: total > 0 ? (onTime / total) * 100 : 0,
  };
}
```

---

## 7. INTEGRATION POINTS

### 7.1 Existing Setup Form Integration

**File:** `client/src/pages/setup/SetupForm.tsx` or similar

**Changes:**
1. Add new optional step/section: "Appliances" (collapsible)
2. Import `ApplianceSetupSection` component
3. Add appliances array to form state
4. On form submission, include appliances in POST request
5. Backend setup endpoint receives appliances array and creates records

**Backend:** `server/src/routes/setup.ts`

**Modified Endpoint:** `POST /api/setup/activate`

**Request Body Enhancement:**
```json
{
  // Existing fields...
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  // ... other existing fields
  
  // NEW: Optional appliances array
  "appliances": [
    {
      "appliance_type": "HVAC System",
      "brand": "Carrier",
      "model_number": "24ACC636A003",
      "serial_number": "4219A00123",
      "purchase_date": "2020-05-15",
      "warranty_expiration": "2027-06-01",
      // ... other appliance fields
    },
    // ... more appliances
  ]
}
```

**Backend Logic Enhancement:**
```typescript
// After creating household record:
if (data.appliances && data.appliances.length > 0) {
  for (const applianceData of data.appliances) {
    await db.insert(householdAppliancesTable).values({
      id: randomUUID(),
      household_id: householdId,
      ...applianceData,
      created_by: 'customer',
      created_by_user_id: householdId,
    });
  }
}
```

---

### 7.2 Task Completion Integration

**File:** `server/src/routes/tasks.ts` or similar

**Modified Endpoint:** `PATCH /api/households/:householdId/tasks/:taskId/complete`

**Request Body Enhancement:**
```json
{
  "completed": true,
  
  // NEW: Optional maintenance log details
  "log_details": {
    "cost": 150.00,
    "service_provider": "ABC HVAC",
    "parts_replaced": "HEPA filter",
    "notes": "Cleaned coils, replaced filter"
  }
}
```

**Backend Logic Enhancement:**
```typescript
// Existing: Mark task as complete
await db.update(householdTaskAssignmentsTable)
  .set({
    status: 'completed',
    completed_at: new Date(),
  })
  .where(eq(householdTaskAssignmentsTable.id, taskId));

// NEW: Auto-create maintenance log
const maintenanceLog = await createMaintenanceLogFromTask(
  taskAssignment,
  new Date(),
  req.body.log_details || {}
);

// NEW: If calendar connected, update event
if (await hasCalendarConnection(taskAssignment.household_id)) {
  await updateCalendarEventStatus(taskId, 'completed');
}
```

---

### 7.3 Google Calendar Integration

**File:** `server/lib/calendarSync.ts`

**New Function:** `syncWarrantyToCalendar`

```typescript
export async function syncWarrantyToCalendar(
  appliance: HouseholdAppliance,
  connection: CalendarConnection
): Promise<void> {
  
  if (!appliance.warranty_expiration) {
    return; // No warranty to sync
  }
  
  const oauth2Client = await getValidAccessToken(connection.id);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Create all-day event on warranty expiration date
  const event = {
    summary: `⚠️ Warranty Expires: ${appliance.appliance_type} - ${appliance.brand}`,
    description: `
Your warranty for the following appliance expires today:

Appliance: ${appliance.appliance_type}
Brand: ${appliance.brand}
Model: ${appliance.model_number}
Serial: ${appliance.serial_number}
Location: ${appliance.location || 'N/A'}

Warranty Details:
Type: ${appliance.warranty_type || 'N/A'}
Provider: ${appliance.warranty_provider || 'N/A'}
Policy Number: ${appliance.warranty_policy_number || 'N/A'}

Consider renewing or purchasing extended warranty if needed.

View in UpKeepQR: ${process.env.FRONTEND_URL}/household/appliances/${appliance.id}
    `.trim(),
    start: {
      date: appliance.warranty_expiration.toISOString().split('T')[0], // YYYY-MM-DD
    },
    end: {
      date: appliance.warranty_expiration.toISOString().split('T')[0],
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 14 * 24 * 60 }, // 14 days before
        { method: 'popup', minutes: 24 * 60 }, // 1 day before
      ],
    },
    colorId: '11', // Red for warnings
  };
  
  try {
    const response = await calendar.events.insert({
      calendarId: connection.calendar_id,
      requestBody: event,
    });
    
    console.log(`✅ Warranty event created: ${response.data.id}`);
  } catch (error) {
    console.error('❌ Failed to create warranty calendar event:', error);
    throw error;
  }
}
```

---

### 7.4 Email Templates

**New Email Templates:**

1. **Warranty Expiration Alert (14 days before)**
   - **Template ID:** `warranty_expiration_alert`
   - **Subject:** `⚠️ Warranty Expiring Soon: {appliance_type}`
   - **Variables:**
     - `household_name`
     - `appliance_type`
     - `appliance_brand`
     - `appliance_model`
     - `appliance_location`
     - `warranty_expiration_date`
     - `days_remaining`
     - `warranty_provider`
     - `policy_number`

2. **Maintenance Log Reminder (Optional, Phase 2)**
   - Remind users to log details after completing task

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1A: Database & Backend Foundation (Days 1-2)

- [ ] **Database Schema**
  - [ ] Create `household_appliances` table
  - [ ] Create `maintenance_logs` table
  - [ ] Create `common_appliances` table
  - [ ] Create all indexes
  - [ ] Run migration
  - [ ] Verify tables in production database

- [ ] **Schema TypeScript Definitions**
  - [ ] Add table definitions to `shared/schema.ts`
  - [ ] Add type exports
  - [ ] Test Drizzle ORM queries locally

- [ ] **Seed Common Appliances**
  - [ ] Insert common appliances data
  - [ ] Verify data in database

### Phase 1B: API Endpoints - Appliances (Days 3-4)

- [ ] **Appliance CRUD Operations**
  - [ ] `POST /api/households/:householdId/appliances` (Create)
  - [ ] `GET /api/households/:householdId/appliances` (List with filters)
  - [ ] `GET /api/households/:householdId/appliances/:applianceId` (Get details)
  - [ ] `PATCH /api/households/:householdId/appliances/:applianceId` (Update)
  - [ ] `DELETE /api/households/:householdId/appliances/:applianceId` (Soft delete)
  - [ ] `GET /api/common-appliances` (List common appliances)

- [ ] **Validation & Error Handling**
  - [ ] Serial number uniqueness check
  - [ ] Date validations (purchase date, warranty expiration)
  - [ ] Authorization checks (homeowner or admin only)

- [ ] **Testing**
  - [ ] Test all endpoints with Postman/curl
  - [ ] Test edge cases (duplicate serial, invalid dates, etc.)

### Phase 1C: API Endpoints - Maintenance Logs (Days 5-6)

- [ ] **Maintenance Log Operations**
  - [ ] `POST /api/households/:householdId/maintenance-logs` (Create manual log)
  - [ ] `GET /api/households/:householdId/maintenance-logs` (List with filters)
  - [ ] `GET /api/households/:householdId/maintenance-logs/:logId` (Get details)
  - [ ] `PATCH /api/households/:householdId/maintenance-logs/:logId` (Update)
  - [ ] `DELETE /api/households/:householdId/maintenance-logs/:logId` (Delete manual logs only)

- [ ] **Auto-Log on Task Completion**
  - [ ] Modify task completion endpoint to create maintenance log
  - [ ] Calculate `was_on_time` and `days_late`
  - [ ] Link to appliance if applicable

- [ ] **Testing**
  - [ ] Test manual log creation
  - [ ] Test auto-log creation from task completion
  - [ ] Test compliance calculations

### Phase 1D: API Endpoints - Reports (Day 7)

- [ ] **Report Endpoints**
  - [ ] `GET /api/households/:householdId/reports/maintenance-history`
  - [ ] `GET /api/households/:householdId/reports/warranty-status`

- [ ] **Report Logic**
  - [ ] Cost trend calculation
  - [ ] Compliance rate calculation
  - [ ] Appliance summary aggregation

- [ ] **Testing**
  - [ ] Test with various date ranges and filters
  - [ ] Verify calculations are accurate

### Phase 1E: Calendar Integration (Days 8-9)

- [ ] **Warranty Calendar Sync**
  - [ ] `POST /api/households/:householdId/calendar/sync-warranties`
  - [ ] Implement `syncWarrantyToCalendar` function
  - [ ] Create all-day events with reminders

- [ ] **Cron Job for Warranty Alerts**
  - [ ] Create daily cron job (6 AM)
  - [ ] Query expiring warranties (14-day window)
  - [ ] Send email alerts
  - [ ] Auto-sync to calendar if connected

- [ ] **Testing**
  - [ ] Test manual warranty sync
  - [ ] Test cron job locally
  - [ ] Verify calendar events created correctly
  - [ ] Test email alerts

### Phase 1F: Frontend - Setup Form Integration (Days 10-11)

- [ ] **Appliance Setup Section Component**
  - [ ] Create `ApplianceSetupSection.tsx`
  - [ ] Add appliance form modal
  - [ ] Integrate with common appliances API
  - [ ] Add appliance list display with edit/remove

- [ ] **Setup Form Integration**
  - [ ] Add appliances section to setup form
  - [ ] Make section optional and collapsible
  - [ ] Handle form state for appliances array
  - [ ] Submit appliances with setup data

- [ ] **Testing**
  - [ ] Test adding appliances during setup
  - [ ] Test validation (serial uniqueness, etc.)
  - [ ] Test setup completion with appliances

### Phase 1G: Frontend - Household Dashboard (Days 12-14)

- [ ] **Appliance Management Page**
  - [ ] Create `ApplianceManagementPage.tsx`
  - [ ] Grid/list view with filtering and sorting
  - [ ] Warranty status indicators
  - [ ] Add/Edit/Delete functionality

- [ ] **Appliance Details Modal**
  - [ ] Create `ApplianceDetailsModal.tsx`
  - [ ] Overview tab (editable fields)
  - [ ] Warranty tab (details, countdown, sync button)
  - [ ] Maintenance History tab (filtered logs)

- [ ] **Navigation**
  - [ ] Add "Appliances" link to household dashboard sidebar

- [ ] **Testing**
  - [ ] Test CRUD operations from frontend
  - [ ] Test warranty sync to calendar button
  - [ ] Test all filters and sorting

### Phase 1H: Frontend - Maintenance Logging (Days 15-16)

- [ ] **Maintenance Log Page**
  - [ ] Create `MaintenanceLogPage.tsx`
  - [ ] Timeline view of maintenance activities
  - [ ] Filter panel (date range, appliance, type, cost)
  - [ ] Summary cards (totals, averages, compliance)
  - [ ] Export buttons (PDF, CSV)

- [ ] **Add Manual Log Modal**
  - [ ] Create `AddMaintenanceLogModal.tsx`
  - [ ] Form with all fields
  - [ ] Validation

- [ ] **Task Completion Enhancement**
  - [ ] Modify `TaskCompletionModal.tsx`
  - [ ] Add optional "Log Details" section
  - [ ] "Skip Logging" vs "Save & Log Details" buttons

- [ ] **Navigation**
  - [ ] Add "Maintenance Log" link to household dashboard sidebar

- [ ] **Testing**
  - [ ] Test manual log creation
  - [ ] Test task completion with detailed logging
  - [ ] Test filters and export

### Phase 1I: Frontend - Maintenance History Report (Days 17-18)

- [ ] **Report Page**
  - [ ] Create `MaintenanceHistoryReport.tsx`
  - [ ] Date range selector with presets
  - [ ] Appliance filter (multi-select)
  - [ ] Summary cards
  - [ ] Cost trend chart (line chart)
  - [ ] Maintenance by appliance chart (bar chart)
  - [ ] Compliance chart (pie chart)
  - [ ] Detailed table (sortable, filterable)

- [ ] **Export Functionality**
  - [ ] Export PDF (formatted report)
  - [ ] Export CSV (raw data)
  - [ ] Print-friendly view

- [ ] **Navigation**
  - [ ] Add "Reports" → "Maintenance History" link to sidebar

- [ ] **Testing**
  - [ ] Test with various filters
  - [ ] Test chart rendering
  - [ ] Test PDF export
  - [ ] Test CSV export

### Phase 1J: Admin Dashboard Enhancements (Day 19)

- [ ] **Admin Appliance Overview**
  - [ ] Create `AdminApplianceOverview.tsx`
  - [ ] System-wide statistics
  - [ ] Warranty expiration calendar
  - [ ] Most common appliances report
  - [ ] Maintenance cost trends

- [ ] **Admin Household Creation**
  - [ ] Add appliance section to admin household creation form
  - [ ] Same functionality as customer setup

- [ ] **Testing**
  - [ ] Test admin views
  - [ ] Test admin appliance creation on behalf of households

### Phase 1K: Email Templates & Notifications (Day 20)

- [ ] **Email Templates**
  - [ ] Create warranty expiration alert email template
  - [ ] Design responsive HTML email
  - [ ] Add SendGrid template or use inline HTML

- [ ] **Testing**
  - [ ] Test warranty expiration email
  - [ ] Verify email links work correctly
  - [ ] Test on mobile and desktop email clients

### Phase 1L: Final Testing & Documentation (Days 21-22)

- [ ] **End-to-End Testing**
  - [ ] Test complete user journey: Setup → Add appliance → Complete task → View log → Generate report
  - [ ] Test admin journey: Create household with appliances → View reports
  - [ ] Test warranty expiration alert system
  - [ ] Test calendar sync

- [ ] **Cross-Browser Testing**
  - [ ] Test on Chrome, Firefox, Safari, Edge
  - [ ] Test responsive design on mobile devices

- [ ] **Performance Testing**
  - [ ] Test report generation with large datasets
  - [ ] Test appliance list with many appliances
  - [ ] Optimize queries if needed

- [ ] **Documentation**
  - [ ] Update README with new features
  - [ ] Document API endpoints
  - [ ] Create user guide for appliance and maintenance log features

### Phase 1M: Deployment (Day 23)

- [ ] **Database Migration**
  - [ ] Run migration on production database
  - [ ] Verify tables and indexes created
  - [ ] Seed common appliances data

- [ ] **Backend Deployment**
  - [ ] Deploy backend code to Render
  - [ ] Verify environment variables set
  - [ ] Test API endpoints in production

- [ ] **Frontend Deployment**
  - [ ] Build and deploy frontend to Firebase Hosting
  - [ ] Verify all pages load correctly
  - [ ] Test complete workflows in production

- [ ] **Cron Job Setup**
  - [ ] Configure warranty alert cron job on Render
  - [ ] Test cron job execution
  - [ ] Monitor logs

- [ ] **Monitoring**
  - [ ] Set up error tracking (if not already)
  - [ ] Monitor API response times
  - [ ] Monitor email delivery rates

---

## 9. TESTING SCENARIOS

### 9.1 Appliance Management

**Test Case 1: Add Appliance During Setup**
1. User scans QR code → setup form loads
2. User fills personal and home details
3. User expands "Appliances" section
4. User clicks "Add Appliance"
5. User selects "HVAC System" from dropdown
6. Dropdown shows common brands: Carrier, Trane, Lennox, etc.
7. User fills Brand: "Carrier", Model: "24ACC636A003", Serial: "UNIQUE123", Purchase Date: "2020-05-15"
8. User adds warranty: Type: "Extended", Expiration: "2027-06-01"
9. User clicks "Save Appliance"
10. Appliance appears in list under section
11. User completes setup
12. **Expected:** Household created, appliance record created, user redirected to dashboard

**Test Case 2: Add Duplicate Serial Number**
1. User attempts to add appliance with serial number that already exists in system
2. **Expected:** API returns 400 error, frontend shows: "Serial number already exists in system"

**Test Case 3: Add Appliance from Dashboard**
1. User logs into household dashboard
2. User clicks "Appliances" in sidebar
3. User clicks "Add New Appliance"
4. User fills form with valid data
5. User clicks "Save"
6. **Expected:** Appliance appears in list immediately, success message shown

**Test Case 4: Edit Appliance**
1. User clicks "Edit" on an appliance
2. User updates Location from "Upstairs" to "Main Floor"
3. User clicks "Save"
4. **Expected:** Appliance updated, changes reflected immediately

**Test Case 5: Delete Appliance**
1. User clicks "Delete" on an appliance
2. Confirmation modal appears
3. User confirms deletion
4. **Expected:** Appliance hidden from list (soft delete), maintenance logs remain intact

---

### 9.2 Maintenance Logging

**Test Case 6: Complete Task with Detailed Logging**
1. User receives maintenance reminder (SMS/email)
2. User logs into dashboard
3. User sees pending task: "Replace HVAC filter"
4. User clicks "Mark Complete"
5. Task completion modal opens
6. User selects "Yes, I completed this task"
7. User expands "Add maintenance details" section
8. User fills: Cost: $150, Service Provider: "ABC HVAC", Parts: "HEPA filter", Notes: "Cleaned coils"
9. User clicks "Complete & Log Details"
10. **Expected:** 
    - Task marked complete
    - Maintenance log created with all details
    - Cost added to household totals
    - If calendar connected, event updated to "completed"
    - User sees confirmation message

**Test Case 7: Complete Task Late**
1. Task due date: 2025-12-01
2. User completes task on: 2025-12-05 (4 days late)
3. **Expected:**
    - Maintenance log shows `was_on_time: false`, `days_late: 4`
    - Compliance rate decreases
    - Timeline shows "Completed 4 days late"

**Test Case 8: Add Manual Maintenance Log**
1. User clicks "Maintenance Log" in sidebar
2. User clicks "Add Manual Entry"
3. User fills: Appliance: "Water Heater", Date: "2025-12-09", Task: "Emergency repair - replaced heating element", Type: "Emergency", Cost: $350
4. User clicks "Save Log"
5. **Expected:** Log appears in timeline immediately, cost added to totals

---

### 9.3 Warranty Tracking & Alerts

**Test Case 9: Warranty Expiring in 14 Days**
1. System cron job runs at 6 AM
2. Finds appliance with warranty expiring in 10 days
3. **Expected:**
    - Email sent to homeowner with details
    - If calendar connected, event created with 14-day and 1-day reminders
    - Appliance marked `warranty_alert_sent: true`

**Test Case 10: Manual Warranty Sync to Calendar**
1. User views appliance details
2. User sees warranty expires in 10 days
3. User clicks "Sync to Calendar" button
4. **Expected:**
    - All-day event created on warranty expiration date
    - Event title: "⚠️ Warranty Expires: HVAC System - Carrier"
    - Event has 14-day email reminder and 1-day popup reminder
    - User sees success message: "Warranty date added to calendar"

**Test Case 11: Warranty Status Report**
1. User navigates to "Reports" → "Warranty Status"
2. **Expected:** Report shows:
    - Summary: Total appliances, under warranty, expired, expiring soon
    - "Expiring Soon" section lists appliances with <14 days remaining
    - "Under Warranty" section lists all with active warranties
    - "Expired" section lists all with expired warranties

---

### 9.4 Maintenance History Reports

**Test Case 12: Generate 6-Month Report**
1. User navigates to "Reports" → "Maintenance History"
2. User selects date range: "Last 6 months"
3. User clicks "Apply Filters"
4. **Expected:** Report displays:
    - Summary cards: Total events, total cost, average cost, compliance rate
    - Cost trend chart showing monthly costs
    - Maintenance by appliance bar chart
    - Compliance pie chart (on time vs late vs skipped)
    - Detailed table of all logs in period

**Test Case 13: Filter by Appliance**
1. User selects appliance filter: "HVAC System (Upstairs)"
2. User clicks "Apply Filters"
3. **Expected:** Report shows only maintenance logs for that appliance

**Test Case 14: Export Report as PDF**
1. User generates report with filters
2. User clicks "Export PDF"
3. **Expected:**
    - PDF downloads with formatted report
    - PDF includes all charts, tables, and summary data
    - PDF is printable and shareable

**Test Case 15: Export Report as CSV**
1. User generates report
2. User clicks "Export CSV"
3. **Expected:**
    - CSV file downloads with raw data
    - CSV includes all log fields: date, appliance, task, cost, provider, notes, etc.
    - CSV is importable into Excel/Google Sheets

---

### 9.5 Integration with Existing Features

**Test Case 16: Setup Form with Appliances**
1. User completes entire setup form including 3 appliances
2. User submits form
3. **Expected:**
    - Household created
    - 3 appliance records created
    - Task assignments created (existing flow)
    - Welcome email sent (existing flow)
    - User redirected to dashboard

**Test Case 17: Admin Creates Household with Appliances**
1. Admin logs in
2. Admin navigates to "Setup Forms" → "Create New Household"
3. Admin fills form including 2 appliances
4. Admin submits
5. **Expected:**
    - Household created with `created_by: 'admin'`
    - 2 appliances created with `created_by: 'admin'`
    - No QR activation required (admin mode)

**Test Case 18: Calendar Sync After Task Completion**
1. User has Google Calendar connected
2. User completes scheduled task
3. Detailed logging included
4. **Expected:**
    - Task marked complete
    - Maintenance log created
    - Calendar event status updated to "completed"
    - Event notes updated with maintenance details

---

### 9.6 Edge Cases & Error Handling

**Test Case 19: Add Appliance with Invalid Purchase Date (Future)**
1. User attempts to add appliance with purchase date in future
2. **Expected:** Validation error: "Purchase date cannot be in the future"

**Test Case 20: Add Appliance with Warranty Expiration Before Purchase Date**
1. User attempts to add appliance with warranty expiration before purchase date
2. **Expected:** Validation error: "Warranty expiration must be after purchase date"

**Test Case 21: Complete Task Without Calendar Connection**
1. User has not connected Google Calendar
2. User completes task with detailed logging
3. **Expected:**
    - Task marked complete
    - Maintenance log created
    - No calendar update attempted (gracefully skips)

**Test Case 22: Generate Report with No Data**
1. New household with no maintenance logs
2. User navigates to "Maintenance History"
3. **Expected:**
    - Summary cards show 0 values
    - Charts display "No data available"
    - Empty state message: "No maintenance logs yet. Complete tasks or add manual entries to see your history."

**Test Case 23: Cron Job Fails to Send Email**
1. Warranty expiring in 10 days
2. Email service (SendGrid) returns error
3. **Expected:**
    - Error logged in console
    - Appliance NOT marked `warranty_alert_sent: true` (will retry next day)
    - Other appliances in batch continue processing

---

### 9.7 Performance Testing

**Test Case 24: Large Appliance List**
1. Household has 50 appliances
2. User navigates to "Appliances" page
3. **Expected:** Page loads in <2 seconds, all appliances rendered

**Test Case 25: Large Maintenance Log**
1. Household has 500 maintenance log entries
2. User navigates to "Maintenance Log" page
3. **Expected:**
    - Page loads in <2 seconds
    - Pagination works correctly
    - Filters apply quickly (<1 second)

**Test Case 26: Report with 5 Years of Data**
1. User generates report for 5-year period
2. Report includes 1000+ maintenance events
3. **Expected:**
    - Report generates in <5 seconds
    - Charts render correctly
    - Export to PDF completes successfully

---

## 10. PHASE 2 FEATURES (Future)

### 10.1 Service Professional Access

**Feature:** Allow service professionals (from Pro Requests) to log maintenance they performed

**Requirements:**
- Service pro receives access token after completing pro request
- Service pro can add maintenance logs to specific households
- Logs tagged with `created_by: 'pro'`
- Homeowner receives notification when pro adds log
- Pro can upload before/after photos

**Database Changes:**
- No new tables needed
- Use existing `maintenance_logs` table with `created_by: 'pro'`

**API Endpoints:**
- `POST /api/pro/:proId/households/:householdId/maintenance-logs`
- Requires pro authentication token

---

### 10.2 Document Uploads

**Feature:** Upload warranty documents, service records, manuals

**Requirements:**
- PDF upload for warranty certificates, user manuals, service records
- Store in Firebase Storage or S3
- Link documents to appliances
- Download and view in browser

**Database Changes:**
- New table: `appliance_documents`
  - id, appliance_id, document_type, file_name, file_url, file_size, uploaded_at

**API Endpoints:**
- `POST /api/households/:householdId/appliances/:applianceId/documents` (Upload)
- `GET /api/households/:householdId/appliances/:applianceId/documents` (List)
- `DELETE /api/households/:householdId/appliances/:applianceId/documents/:docId` (Delete)

**Frontend:**
- Add "Documents" tab to Appliance Details Modal
- File upload component with drag-and-drop
- Document list with download buttons

---

### 10.3 Predictive Maintenance

**Feature:** AI-powered predictions for when appliances may need service

**Requirements:**
- Analyze maintenance history patterns
- Factor in appliance age, typical lifespan, maintenance frequency
- Alert users: "Your Water Heater is 10 years old (avg lifespan: 12 years). Consider replacement soon."

**Implementation:**
- Machine learning model trained on appliance data
- Monthly analysis of all appliances
- Proactive recommendations

---

### 10.4 Mobile App

**Feature:** Native iOS/Android app for maintenance tracking

**Features:**
- Push notifications for maintenance reminders
- Photo upload for maintenance logs (before/after)
- Barcode scanner for adding appliances
- Offline mode for viewing maintenance history

---

### 10.5 Appliance Marketplace Integration

**Feature:** Direct links to purchase replacement parts, hire services

**Requirements:**
- Integration with parts suppliers (Amazon, Home Depot, etc.)
- Links to local service providers
- Affiliate revenue potential

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Data Privacy

- **Sensitive Information:** Appliance serial numbers, warranty policy numbers, service provider details
- **Access Control:**
  - Homeowners can only view/edit their own appliances and logs
  - Admins can view/edit all appliances (audit log required)
  - Service pros (Phase 2) can only add logs, not edit/delete

### 11.2 API Security

- **Authentication:** All endpoints require valid JWT token or API key
- **Authorization:** Check household ownership before returning data
- **Rate Limiting:** Prevent abuse of report generation endpoints
- **Input Validation:** Sanitize all user inputs (especially notes, descriptions)

### 11.3 Data Integrity

- **Serial Number Uniqueness:** Enforce at database and application level
- **Date Validation:** Purchase dates, warranty expirations, maintenance dates
- **Soft Deletes:** Never hard delete appliances (preserve maintenance history)
- **Audit Logging:** Track who created/edited appliances and logs

---

## 12. APPENDIX

### 12.1 Email Template: Warranty Expiration Alert

**Subject:** ⚠️ Warranty Expiring Soon: {appliance_type}

**Body:**
```
Hi {household_name},

This is a friendly reminder that the warranty for your {appliance_type} is expiring soon.

Appliance Details:
- Type: {appliance_type}
- Brand: {appliance_brand}
- Model: {appliance_model}
- Location: {appliance_location}

Warranty Information:
- Provider: {warranty_provider}
- Policy Number: {policy_number}
- Expiration Date: {warranty_expiration_date}
- Days Remaining: {days_remaining}

What You Should Do:
1. Review your warranty coverage details
2. Contact {warranty_provider} if you wish to renew or extend
3. Consider purchasing an extended warranty if available
4. Schedule a maintenance check before warranty expires

View full appliance details and maintenance history in your UpKeepQR dashboard:
{dashboard_link}

Need Help?
Reply to this email or contact support@upkeepqr.com

Best regards,
UpKeepQR Team
```

---

### 12.2 Common Appliances Reference Data

**Categories:**
- HVAC
- Plumbing
- Kitchen
- Laundry
- Electrical
- Safety
- Outdoor

**Sample Data:**
```json
[
  {
    "appliance_type": "HVAC System",
    "category": "HVAC",
    "typical_lifespan_years": 15,
    "common_brands": ["Carrier", "Trane", "Lennox", "Rheem", "Goodman"],
    "maintenance_notes": "Change filters every 1-3 months, annual professional inspection recommended"
  },
  {
    "appliance_type": "Water Heater",
    "category": "Plumbing",
    "typical_lifespan_years": 12,
    "common_brands": ["Rheem", "AO Smith", "Bradford White", "Rinnai"],
    "maintenance_notes": "Flush tank annually, check anode rod every 2-3 years"
  },
  ...
]
```

---

### 12.3 Cost Calculation Formulas

**Average Cost Per Event:**
```
average_cost = total_cost / total_events
```

**Monthly Cost Trend:**
```
For each month in period:
  monthly_cost = SUM(cost) WHERE MONTH(maintenance_date) = month
  monthly_event_count = COUNT(*) WHERE MONTH(maintenance_date) = month
```

**Compliance Rate:**
```
compliance_rate = completed_on_time / (completed_on_time + completed_late + skipped)
```

**On-Time Percentage:**
```
on_time_percentage = (completed_on_time / total_completed) * 100
```

---

## END OF SPECIFICATION

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Implementation  
**Estimated Implementation Time:** 23 days (with 1-2 developers)

---

**Next Steps:**
1. Review specification with stakeholders
2. Get approval on scope and timeline
3. Begin Phase 1A: Database schema implementation
4. Follow implementation checklist sequentially
5. Conduct testing after each phase
6. Deploy to production after Phase 1M

**Questions or Clarifications:**
Contact the product team or refer to this specification document.

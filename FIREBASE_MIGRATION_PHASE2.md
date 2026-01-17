# Firebase → PostgreSQL Migration - Phase 2

## Current State
- ✅ Phase 1 Complete: homeExtra.ts migrated
- ⚠️ storage.ts still uses Firebase for collections that ALREADY EXIST in PostgreSQL!

## Critical Discovery
**MAGNETS ARE ALREADY IN POSTGRESQL!**
- order_magnet_items = Firebase "magnets" collection
- order_magnet_batches = Firebase "magnetBatches" collection
- households = Firebase "households" collection (duplicate!)

## Phase 2 Tasks

### Task 1: Create Missing Tables
Create PostgreSQL tables for:
1. agents
2. leads (table, not just schema)
3. schedules
4. task_completions  
5. reminder_queue

### Task 2: Update storage.ts Functions
Map Firebase collections to PostgreSQL tables:
- MAGNETS → order_magnet_items
- MAGNET_BATCHES → order_magnet_batches
- HOUSEHOLDS → households (already migrated!)
- AGENTS → agents (need to create)
- LEADS → leads (need to create table)
- TASKS → home_maintenance_tasks (check if exists)

### Task 3: Data Migration
Only migrate collections NOT already in PostgreSQL:
- agents (if has data)
- leads (if has data)
- Any Firebase-only data

### Task 4: Testing
- Test each migrated function
- Verify data integrity
- Keep Firebase read-only as backup

## Next Steps
1. Show me storage.ts to see function mapping
2. Create missing table schemas
3. Update storage.ts functions one by one
4. Test thoroughly
5. Remove Firebase (Phase 3)

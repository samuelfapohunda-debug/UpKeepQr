-- Add completion-detail columns to maintenance_tasks so that cost, service
-- provider, parts replaced, and notes recorded via the Complete Task modal
-- are actually persisted to the database.
ALTER TABLE "maintenance_tasks" ADD COLUMN IF NOT EXISTS "cost" numeric(10, 2);
ALTER TABLE "maintenance_tasks" ADD COLUMN IF NOT EXISTS "service_provider" varchar(200);
ALTER TABLE "maintenance_tasks" ADD COLUMN IF NOT EXISTS "parts_replaced" text;
ALTER TABLE "maintenance_tasks" ADD COLUMN IF NOT EXISTS "notes" text;

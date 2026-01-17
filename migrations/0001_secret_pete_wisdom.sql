CREATE TABLE IF NOT EXISTS "calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"provider" varchar(20) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp,
	"calendar_id" text NOT NULL,
	"calendar_name" text,
	"calendar_timezone" text DEFAULT 'America/New_York' NOT NULL,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"last_sync" timestamp,
	"last_sync_status" varchar(20),
	"last_sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_sync_events" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"household_id" text NOT NULL,
	"task_id" text,
	"task_title" text NOT NULL,
	"google_event_id" text NOT NULL,
	"event_start" timestamp NOT NULL,
	"event_end" timestamp NOT NULL,
	"event_status" varchar(20) NOT NULL,
	"sync_status" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_sync_events_google_event_id_unique" UNIQUE("google_event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "common_appliances" (
	"id" serial PRIMARY KEY NOT NULL,
	"appliance_type" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"typical_lifespan_years" integer,
	"common_brands" text[],
	"maintenance_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "common_appliances_appliance_type_unique" UNIQUE("appliance_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "household_appliances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar NOT NULL,
	"appliance_type" varchar(100) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model_number" varchar(100) NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"purchase_price" numeric(10, 2),
	"installation_date" timestamp,
	"location" varchar(200),
	"notes" text,
	"warranty_type" varchar(50),
	"warranty_expiration" timestamp,
	"warranty_provider" varchar(100),
	"warranty_policy_number" varchar(100),
	"warranty_coverage_details" text,
	"warranty_alert_sent" boolean DEFAULT false,
	"warranty_alert_sent_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(50),
	"created_by_user_id" varchar(255),
	CONSTRAINT "household_appliances_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "household_task_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"household_id" varchar NOT NULL,
	"task_id" integer NOT NULL,
	"due_date" timestamp NOT NULL,
	"frequency" varchar(50),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"skipped_reason" text,
	"priority" varchar(20) DEFAULT 'medium',
	"notes" text,
	"reminder_sent" boolean DEFAULT false,
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar NOT NULL,
	"task_assignment_id" varchar,
	"appliance_id" varchar,
	"maintenance_date" timestamp NOT NULL,
	"task_performed" text NOT NULL,
	"log_type" varchar(20) NOT NULL,
	"cost" numeric(10, 2),
	"service_provider" varchar(200),
	"parts_replaced" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar(50),
	"created_by_user_id" varchar(255),
	"was_on_time" boolean,
	"days_late" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_sync_events" ADD CONSTRAINT "calendar_sync_events_connection_id_calendar_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."calendar_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_sync_events" ADD CONSTRAINT "calendar_sync_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "household_appliances" ADD CONSTRAINT "household_appliances_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_task_assignment_id_household_task_assignments_id_fk" FOREIGN KEY ("task_assignment_id") REFERENCES "public"."household_task_assignments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_appliance_id_household_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."household_appliances"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_appliances_household" ON "household_appliances" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_appliances_type" ON "household_appliances" USING btree ("appliance_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_appliances_warranty_exp" ON "household_appliances" USING btree ("warranty_expiration");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_appliances_active" ON "household_appliances" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household" ON "household_task_assignments" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_due_date" ON "household_task_assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_status" ON "household_task_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_task" ON "household_task_assignments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household_status" ON "household_task_assignments" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household_due" ON "household_task_assignments" USING btree ("household_id","due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_logs_household" ON "maintenance_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_logs_appliance" ON "maintenance_logs" USING btree ("appliance_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_logs_task" ON "maintenance_logs" USING btree ("task_assignment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_logs_date" ON "maintenance_logs" USING btree ("maintenance_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_maintenance_logs_type" ON "maintenance_logs" USING btree ("log_type");
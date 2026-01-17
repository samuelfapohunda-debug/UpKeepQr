CREATE TABLE IF NOT EXISTS "agents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"company" varchar(255),
	"status" varchar(50) DEFAULT 'active',
	"commission_rate" numeric(5, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminder_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"task_id" varchar(255),
	"task_name" varchar(255) NOT NULL,
	"task_description" text,
	"due_date" date NOT NULL,
	"run_at" timestamp NOT NULL,
	"method" varchar(50) DEFAULT 'email',
	"status" varchar(50) DEFAULT 'pending',
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"frequency" varchar(50),
	"next_due_date" date,
	"last_completed_date" date,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_completions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"task_id" integer,
	"schedule_id" varchar(255),
	"completed_at" timestamp NOT NULL,
	"completed_by" varchar(255),
	"notes" text,
	"cost" numeric(10, 2),
	"service_provider" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "full_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "phone" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "street_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "zip_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "calendar_sync_preference" varchar(50) DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "agent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "status" text DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminder_queue" ADD CONSTRAINT "reminder_queue_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_home_maintenance_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."home_maintenance_tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reminder_queue_status" ON "reminder_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reminder_queue_run_at" ON "reminder_queue" USING btree ("run_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reminder_queue_household" ON "reminder_queue" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedules_household" ON "schedules" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedules_task" ON "schedules" USING btree ("task_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_schedules_household_task" ON "schedules" USING btree ("household_id","task_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_task_completions_household" ON "task_completions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_task_completions_completed" ON "task_completions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_households_agent_id" ON "households" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_agent" ON "leads" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_created" ON "leads" USING btree ("created_at");
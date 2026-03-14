CREATE TABLE IF NOT EXISTS "ai_generation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"home_profile_id" integer NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"response" text,
	"tokens_used" integer,
	"success" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"address" varchar(255),
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(10),
	"year_built" integer,
	"square_footage" integer,
	"home_type" varchar(50),
	"roof_type" varchar(50),
	"hvac_type" varchar(50),
	"climate_zone" varchar(100),
	"climate_zone_source" varchar(50) DEFAULT 'state_heuristic',
	"appliances" json DEFAULT '[]'::json,
	"schedule_generated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
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
CREATE TABLE IF NOT EXISTS "maintenance_task_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"typical_cost_min" integer,
	"typical_cost_max" integer,
	"applies_to" varchar(100),
	"climate_zones" json DEFAULT '[]'::json,
	"min_home_age" integer,
	"max_home_age" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maintenance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"home_profile_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"month" integer NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"estimated_cost_min" integer,
	"estimated_cost_max" integer,
	"estimated_diy_cost" integer,
	"estimated_pro_cost" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household" ON "household_task_assignments" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_due_date" ON "household_task_assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_status" ON "household_task_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_task" ON "household_task_assignments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household_status" ON "household_task_assignments" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_household_task_assignments_household_due" ON "household_task_assignments" USING btree ("household_id","due_date");
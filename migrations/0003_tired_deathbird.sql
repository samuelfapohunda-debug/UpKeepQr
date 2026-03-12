CREATE TABLE "cancellation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255),
	"reason" varchar(50),
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255),
	"email_type" varchar(50) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"bounced" boolean DEFAULT false,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "feature_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_tier" varchar(20) NOT NULL,
	"feature_key" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true,
	"limit_value" integer
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"household_id" varchar(255),
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(64) NOT NULL,
	"email" varchar(255) NOT NULL,
	"household_id" varchar(255),
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "signup_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"canonical_email" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" varchar(255),
	"success" boolean DEFAULT false,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" varchar(255),
	"stripe_event_type" varchar(100) NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"subscription_status_before" varchar(30),
	"subscription_status_after" varchar(30),
	"metadata" jsonb,
	"processing_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "warranty_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_appliance_id" varchar(255) NOT NULL,
	"household_id" varchar(255) NOT NULL,
	"notification_type" varchar(20) NOT NULL,
	"notification_method" varchar(20) NOT NULL,
	"email_sent" boolean DEFAULT false,
	"sms_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"sms_sent_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "subscription_tier" varchar(20) DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "billing_interval" varchar(20);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "subscription_status" varchar(30) DEFAULT 'incomplete';--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "trial_starts_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "trial_used" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "first_payment_attempt_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "grace_period_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "email_verification_token" varchar(255);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "stripe_payment_method_id" varchar(255);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "canonical_email" varchar(255);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "signup_ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "signup_user_agent" text;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "payment_added_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "cancellation_type" varchar(30);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "cancellation_source" varchar(50);--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "first_qr_scan_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "first_maintenance_task_at" timestamp;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "sms_enabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "order_magnet_items" ADD COLUMN "household_id" varchar(255);--> statement-breakpoint
ALTER TABLE "cancellation_feedback" ADD CONSTRAINT "cancellation_feedback_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_links" ADD CONSTRAINT "magic_links_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_notifications" ADD CONSTRAINT "warranty_notifications_household_appliance_id_household_appliances_id_fk" FOREIGN KEY ("household_appliance_id") REFERENCES "public"."household_appliances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_notifications" ADD CONSTRAINT "warranty_notifications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cancellation_feedback_reason" ON "cancellation_feedback" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_cancellation_feedback_household" ON "cancellation_feedback" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_email_events_household_id" ON "email_events" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_email_events_type" ON "email_events" USING btree ("email_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_feature_perm_tier_key" ON "feature_permissions" USING btree ("subscription_tier","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_magic_links_token" ON "magic_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_magic_links_email" ON "magic_links" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_magic_links_expires" ON "magic_links" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_email" ON "sessions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_signup_attempts_email" ON "signup_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_signup_attempts_canonical" ON "signup_attempts" USING btree ("canonical_email");--> statement-breakpoint
CREATE INDEX "idx_signup_attempts_ip" ON "signup_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_signup_attempts_fingerprint" ON "signup_attempts" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_sub_events_household_id" ON "subscription_events" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_sub_events_type" ON "subscription_events" USING btree ("stripe_event_type");--> statement-breakpoint
CREATE INDEX "idx_sub_events_created_at" ON "subscription_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_warranty_notif_appliance" ON "warranty_notifications" USING btree ("household_appliance_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_notif_household" ON "warranty_notifications" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_warranty_notif_type" ON "warranty_notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "idx_warranty_notif_status" ON "warranty_notifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_warranty_notif_unique" ON "warranty_notifications" USING btree ("household_appliance_id","notification_type");--> statement-breakpoint
CREATE INDEX "idx_households_subscription_status" ON "households" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "idx_households_trial_ends_at" ON "households" USING btree ("trial_ends_at");--> statement-breakpoint
CREATE INDEX "idx_households_stripe_customer_id" ON "households" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_households_trial_used" ON "households" USING btree ("trial_used");--> statement-breakpoint
CREATE INDEX "idx_households_grace_period" ON "households" USING btree ("grace_period_ends_at");--> statement-breakpoint
CREATE INDEX "idx_households_canonical_email" ON "households" USING btree ("canonical_email");
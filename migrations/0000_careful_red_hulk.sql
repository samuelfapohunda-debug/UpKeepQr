CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(255),
	"household_id" varchar(255),
	"order_id" varchar(255),
	"actor" varchar(100) DEFAULT 'admin' NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(160) NOT NULL,
	"message" text NOT NULL,
	"source_ip" varchar(45),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"ticket_id" varchar(20) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_maintenance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_code" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"task_name" varchar(255) NOT NULL,
	"base_frequency" varchar(50) NOT NULL,
	"months_hot_humid" varchar(50),
	"months_cold_snow" varchar(50),
	"months_mixed" varchar(50),
	"months_arid_mountain" varchar(50),
	"seasonal_tag" varchar(50),
	"how_to" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"est_minutes" integer NOT NULL,
	"materials" text,
	"safety_note" text,
	"applies_if_freeze" boolean DEFAULT false NOT NULL,
	"applies_if_hurricane" boolean DEFAULT false NOT NULL,
	"applies_if_wildfire" boolean DEFAULT false NOT NULL,
	"applies_if_hard_water" boolean DEFAULT false NOT NULL,
	"applies_if_has_sprinklers" boolean DEFAULT false NOT NULL,
	"pro_service_recommended" boolean DEFAULT false NOT NULL,
	"diy_ok" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_profile_extras" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL,
	"owner_type" text,
	"sell_window" text,
	"home_type" text,
	"year_built" integer,
	"square_footage" integer,
	"bedrooms" integer,
	"bathrooms" integer,
	"roof_material" text,
	"roof_age_years" integer,
	"hvac_type" text,
	"hvac_age_years" integer,
	"hvac_last_service_month" text,
	"water_heater_type" text,
	"water_heater_age_years" integer,
	"water_heater_capacity_gal" integer,
	"exterior_type" text,
	"lot_sq_ft" integer,
	"insurance_provider" text,
	"insurance_renewal_month" integer,
	"electric_provider" text,
	"gas_provider" text,
	"has_hoa" boolean DEFAULT false,
	"hoa_name" text,
	"planned_projects" text[],
	"smart_home_gear" text[],
	"budget_band" text,
	"contact_pref_channel" text,
	"contact_pref_cadence" text,
	"marketing_consent" boolean DEFAULT true,
	"appliances" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_profile_extras_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "households" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"address_line_1" varchar(255),
	"address_line_2" varchar(255),
	"city" varchar(100),
	"state" varchar(2),
	"zipcode" varchar(10),
	"notification_preference" varchar(20) DEFAULT 'both' NOT NULL,
	"sms_opt_in" boolean DEFAULT false,
	"preferred_contact" varchar(20),
	"setup_status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"setup_completed_at" timestamp,
	"setup_started_at" timestamp,
	"setup_notes" text,
	"setup_issues" text,
	"magnet_code" varchar(50),
	"magnet_token" varchar(50),
	"order_id" varchar(50),
	"last_modified_by" varchar,
	"created_by" varchar(20) DEFAULT 'customer' NOT NULL,
	"created_by_user_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"author" varchar(100) DEFAULT 'admin' NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_magnet_audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar,
	"item_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"actor" varchar(100) DEFAULT 'admin' NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_magnet_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"printer_name" varchar(255),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"unit_cost" numeric(10, 2),
	"quantity" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_magnet_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"sku" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"activation_code" varchar(20) NOT NULL,
	"qr_url" text NOT NULL,
	"activation_status" varchar(20) DEFAULT 'inactive' NOT NULL,
	"activated_at" timestamp,
	"activated_by_email" varchar(255),
	"scan_count" integer DEFAULT 0 NOT NULL,
	"last_scan_at" timestamp,
	"print_batch_id" varchar,
	"serial_number" varchar(50),
	"print_file_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "order_magnet_items_activation_code_unique" UNIQUE("activation_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_magnet_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(50) NOT NULL,
	"ship_address_line_1" varchar(255) NOT NULL,
	"ship_address_line_2" varchar(255),
	"ship_city" varchar(100) NOT NULL,
	"ship_state" varchar(50) NOT NULL,
	"ship_zip" varchar(5) NOT NULL,
	"ship_country" varchar(10) DEFAULT 'US' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"payment_provider" varchar(20) DEFAULT 'stripe' NOT NULL,
	"payment_ref" varchar(255),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"source" varchar(100),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"notes" text,
	CONSTRAINT "order_magnet_orders_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "order_magnet_orders_payment_ref_unique" UNIQUE("payment_ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_magnet_shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"carrier" varchar(100),
	"tracking_number" varchar(100),
	"label_url" varchar(500),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"shipped_at" timestamp,
	"expected_delivery" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pro_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade" varchar(50) NOT NULL,
	"urgency" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"photos" json DEFAULT '[]'::json,
	"address_line_1" varchar(255) NOT NULL,
	"address_line_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip" varchar(5) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50) NOT NULL,
	"preferred_windows" text,
	"status" varchar(50) DEFAULT 'new' NOT NULL,
	"provider_assigned" varchar(255),
	"public_tracking_code" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"trade" varchar(50) NOT NULL,
	"coverage_zips" json NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "setup_form_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" varchar NOT NULL,
	"created_by" varchar,
	"content" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_events" (
	"event_id" varchar(255) PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar(255),
	"order_id" varchar(50),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"preferred_contact" text,
	"hear_about_us" text,
	"street_address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"property_type" text,
	"number_of_locations" integer,
	"location_nickname" text,
	"home_type" text,
	"square_footage" integer,
	"roof_age" integer,
	"hvac_system_type" text,
	"water_heater_type" text,
	"number_of_assets" integer,
	"asset_categories" text,
	"company_name" text,
	"industry_type" text,
	"number_of_employees" integer,
	"business_website" text,
	"preferred_service_type" text,
	"estimated_qr_labels" text,
	"interest_type" text,
	"need_consultation" boolean,
	"is_owner" boolean,
	"budget_range" text,
	"timeline_to_proceed" text,
	"preferred_contact_time" text,
	"notes" text,
	"activation_code" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_households_setup_status" ON "households" USING btree ("setup_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_households_completed_date" ON "households" USING btree ("setup_completed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_households_order_id" ON "households" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_households_location" ON "households" USING btree ("state","zipcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_setup_notes_household" ON "setup_form_notes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_setup_notes_author" ON "setup_form_notes" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_setup_notes_created" ON "setup_form_notes" USING btree ("created_at");
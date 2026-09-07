ALTER TABLE "managed_properties" ADD COLUMN IF NOT EXISTS "bedrooms" integer;
ALTER TABLE "managed_properties" ADD COLUMN IF NOT EXISTS "bathrooms" numeric(4, 1);
ALTER TABLE "managed_properties" ADD COLUMN IF NOT EXISTS "purchase_date" date;
ALTER TABLE "managed_properties" ADD COLUMN IF NOT EXISTS "purchase_price" numeric(15, 2);
ALTER TABLE "managed_properties" ADD COLUMN IF NOT EXISTS "notes" text;

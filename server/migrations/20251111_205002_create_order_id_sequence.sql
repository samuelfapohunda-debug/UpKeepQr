-- Migration: Create order_id_counter sequence for Order ID generation
-- Date: 2025-11-11
-- Description: Creates a PostgreSQL sequence for atomic Order ID counter generation
--              Order IDs use format: {counter}-{year} (e.g., "1-2025", "2-2025")
-- 
-- Note: The order_id column is added automatically by Drizzle via db:push
--       This migration only creates the sequence needed for ID generation

-- Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_id_counter 
  START WITH 1 
  INCREMENT BY 1 
  NO MINVALUE 
  NO MAXVALUE 
  CACHE 1;

-- Initialize sequence to current max counter (only if table and column exist)
-- This handles the case where orders might already have formatted order_ids
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_magnet_orders' AND column_name = 'order_id'
  ) THEN
    PERFORM setval('order_id_counter', 
      COALESCE(
        (SELECT MAX(CAST(SPLIT_PART(order_id, '-', 1) AS INTEGER)) 
         FROM order_magnet_orders 
         WHERE order_id ~ '^\d+-\d{4}$'
        ), 
        0
      )
    );
  END IF;
END $$;

-- Add comment to sequence for documentation
COMMENT ON SEQUENCE order_id_counter IS 'Atomic counter for Order ID generation. Format: {counter}-{year}. Counter never resets across years.';

-- Migration: Add order_id column and create order_id_counter sequence
-- Date: 2025-11-11
-- Description: Implements sequential Order ID format: {counter}-{year} (e.g., "1-2025", "2-2025")
--              Adds order_id column to order_magnet_orders table
--              Creates PostgreSQL sequence for atomic counter generation

-- Step 1: Add order_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_magnet_orders' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE order_magnet_orders 
    ADD COLUMN order_id VARCHAR(50);
    
    RAISE NOTICE 'Added order_id column to order_magnet_orders table';
  ELSE
    RAISE NOTICE 'order_id column already exists, skipping';
  END IF;
END $$;

-- Step 2: Create sequence for atomic counter generation
CREATE SEQUENCE IF NOT EXISTS order_id_counter 
  START WITH 1 
  INCREMENT BY 1 
  NO MINVALUE 
  NO MAXVALUE 
  CACHE 1;

-- Step 3: Initialize sequence to current max counter (if orders already have formatted IDs)
SELECT setval('order_id_counter', 
  COALESCE(
    (SELECT MAX(CAST(SPLIT_PART(order_id, '-', 1) AS INTEGER)) 
     FROM order_magnet_orders 
     WHERE order_id IS NOT NULL AND order_id ~ '^\d+-\d{4}$'
    ), 
    0
  )
);

-- Step 4: Add NOT NULL constraint (after ensuring all existing rows have values)
DO $$
BEGIN
  -- This will be enforced by application code for new inserts
  -- Only add NOT NULL if all existing rows have order_id values
  IF NOT EXISTS (
    SELECT 1 FROM order_magnet_orders WHERE order_id IS NULL
  ) THEN
    ALTER TABLE order_magnet_orders 
    ALTER COLUMN order_id SET NOT NULL;
    
    RAISE NOTICE 'Added NOT NULL constraint to order_id column';
  ELSE
    RAISE NOTICE 'Cannot add NOT NULL constraint - existing rows have NULL order_id values';
  END IF;
END $$;

-- Step 5: Add unique constraint to order_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'order_magnet_orders_order_id_unique'
  ) THEN
    ALTER TABLE order_magnet_orders 
    ADD CONSTRAINT order_magnet_orders_order_id_unique UNIQUE (order_id);
    
    RAISE NOTICE 'Added UNIQUE constraint to order_id column';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on order_id column';
  END IF;
END $$;

-- Add comment to sequence for documentation
COMMENT ON SEQUENCE order_id_counter IS 'Atomic counter for Order ID generation. Format: {counter}-{year}. Counter never resets across years.';

-- Verify the setup
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_magnet_orders' AND column_name = 'order_id';

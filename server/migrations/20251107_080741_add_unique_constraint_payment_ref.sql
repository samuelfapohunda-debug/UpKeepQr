-- Migration: Add unique constraint to payment_ref column
-- This prevents duplicate orders from race conditions in webhook processing

-- First, check for any existing duplicates (optional - for safety)
-- Uncomment these lines if you want to see existing duplicates:
-- SELECT payment_ref, COUNT(*) 
-- FROM order_magnet_orders 
-- WHERE payment_ref IS NOT NULL 
-- GROUP BY payment_ref 
-- HAVING COUNT(*) > 1;

-- Add the unique constraint
ALTER TABLE order_magnet_orders 
ADD CONSTRAINT order_magnet_orders_payment_ref_unique 
UNIQUE (payment_ref);

-- Verify the constraint was added
-- \d order_magnet_orders

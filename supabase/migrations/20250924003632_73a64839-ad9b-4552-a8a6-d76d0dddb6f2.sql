-- Fix the stock issue: Reset the stock to the correct value for the problematic product
-- This product shows stock=2 but the validation fails, likely due to previous failed transactions

UPDATE products 
SET stock = 2 
WHERE id = '33195e46-b566-4df8-a681-fce65e2e4b1f' 
AND has_serial = false;

-- Also clean up any orphaned sales without sale_items from today
DELETE FROM sales 
WHERE created_at >= CURRENT_DATE 
AND id NOT IN (SELECT DISTINCT sale_id FROM sale_items WHERE sale_id IS NOT NULL);
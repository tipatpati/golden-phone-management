-- Fix multi-tenant isolation for sold_product_units table
-- Add store_id column and update RLS policies

-- Step 1: Add store_id column
ALTER TABLE sold_product_units 
ADD COLUMN store_id uuid REFERENCES stores(id);

-- Step 2: Populate store_id from the associated sales records
UPDATE sold_product_units spu
SET store_id = s.store_id
FROM sales s
WHERE spu.sale_id = s.id;

-- Step 3: Make store_id NOT NULL after populating
ALTER TABLE sold_product_units 
ALTER COLUMN store_id SET NOT NULL;

-- Step 4: Add index for performance
CREATE INDEX idx_sold_product_units_store_id ON sold_product_units(store_id);

-- Step 5: Drop the overly permissive RLS policy
DROP POLICY IF EXISTS "Authorized users can view sold units" ON sold_product_units;

-- Step 6: Create store-isolated SELECT policy
CREATE POLICY "Users can view sold units from their store"
ON sold_product_units
FOR SELECT
TO authenticated
USING (
  (get_current_user_role() = 'super_admin'::app_role) 
  OR (store_id = get_user_current_store_id())
);

-- Step 7: Update INSERT policy to ensure store_id is set correctly
DROP POLICY IF EXISTS "System can insert sold units" ON sold_product_units;

CREATE POLICY "System can insert sold units"
ON sold_product_units
FOR INSERT
TO authenticated
WITH CHECK (
  store_id IS NOT NULL
  AND (
    (get_current_user_role() = 'super_admin'::app_role)
    OR (store_id = get_user_current_store_id())
  )
);
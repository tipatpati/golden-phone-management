
-- Fix product_units store_id to match their parent products
-- This ensures all product units are associated with the same store as their parent product

DO $$
DECLARE
  updated_count integer;
BEGIN
  -- Update all product_units to match their parent product's store_id
  UPDATE product_units pu
  SET 
    store_id = p.store_id,
    updated_at = now()
  FROM products p
  WHERE pu.product_id = p.id
    AND (pu.store_id IS NULL OR pu.store_id != p.store_id);

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Updated % product units to match their parent product store assignments', updated_count;
END $$;

-- Add a comment to track this migration
COMMENT ON TABLE public.product_units IS 'Product units are automatically assigned to the same store as their parent product';

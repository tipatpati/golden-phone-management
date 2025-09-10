-- Remove the duplicate stock sync trigger that conflicts with UniversalProductService
DROP TRIGGER IF EXISTS product_units_sync_stock_trg ON public.product_units;

-- Verify the remaining trigger works properly with our service-level updates
-- This ensures we only have the sync_product_stock_from_units trigger handling stock updates
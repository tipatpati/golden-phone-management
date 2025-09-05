-- Delete all products and units with barcodes starting with 'AppleiPhone0'
BEGIN;

-- Collect products to delete
WITH to_delete_products AS (
  SELECT id FROM public.products WHERE barcode ILIKE 'AppleiPhone0%'
)
-- First remove any stray units whose barcode matches (in case they aren't tied to products)
DELETE FROM public.product_units pu
WHERE pu.barcode ILIKE 'AppleiPhone0%'
   OR pu.product_id IN (SELECT id FROM to_delete_products);

-- Now delete the products (will also cascade to units via FK if defined)
DELETE FROM public.products p
WHERE p.id IN (SELECT id FROM to_delete_products);

COMMIT;
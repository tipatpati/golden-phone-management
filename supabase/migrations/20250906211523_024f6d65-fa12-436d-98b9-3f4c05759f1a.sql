-- Add unique constraint to prevent duplicate barcodes
ALTER TABLE product_units 
ADD CONSTRAINT product_units_barcode_unique 
UNIQUE (barcode) 
DEFERRABLE INITIALLY DEFERRED;

-- Add index for better performance on barcode lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_units_barcode_non_null 
ON product_units (barcode) 
WHERE barcode IS NOT NULL AND barcode != '';

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT product_units_barcode_unique ON product_units IS 
'Ensures barcode uniqueness across all product units. Deferrable to allow for batch updates during backfill operations.';
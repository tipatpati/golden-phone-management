-- Backfill missing barcodes for existing product units
UPDATE product_units 
SET barcode = 'GPMSU' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 6)
WHERE barcode IS NULL OR barcode = '';

-- Add a unique constraint to prevent duplicate barcodes in the future
DO $$ 
BEGIN
    -- Only add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_units_barcode_unique'
    ) THEN
        ALTER TABLE product_units 
        ADD CONSTRAINT product_units_barcode_unique 
        UNIQUE (barcode);
    END IF;
END $$;
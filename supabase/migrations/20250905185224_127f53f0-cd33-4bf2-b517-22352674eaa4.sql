-- Enforce uniqueness now that duplicates are resolved
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_barcode 
ON public.products(barcode) 
WHERE barcode IS NOT NULL AND barcode != '';

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_units_barcode 
ON public.product_units(barcode) 
WHERE barcode IS NOT NULL AND barcode != '';
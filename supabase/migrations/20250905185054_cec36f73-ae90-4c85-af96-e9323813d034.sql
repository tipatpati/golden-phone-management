-- Fix massive duplicate barcodes by making each unique with a sequential suffix

-- Step 1: Update products table to make all barcodes unique
WITH ranked_products AS (
  SELECT id, barcode, 
         ROW_NUMBER() OVER (PARTITION BY barcode ORDER BY created_at ASC, id ASC) as rn
  FROM public.products 
  WHERE barcode IS NOT NULL AND barcode != ''
)
UPDATE public.products 
SET barcode = CASE 
  WHEN rp.rn = 1 THEN products.barcode  -- Keep the first occurrence unchanged
  ELSE products.barcode || '-' || lpad(rp.rn::text, 4, '0')  -- Add sequential suffix
END
FROM ranked_products rp
WHERE products.id = rp.id AND rp.rn > 1;

-- Step 2: Update product_units table to make all barcodes unique  
WITH ranked_units AS (
  SELECT id, barcode,
         ROW_NUMBER() OVER (PARTITION BY barcode ORDER BY created_at ASC, id ASC) as rn
  FROM public.product_units 
  WHERE barcode IS NOT NULL AND barcode != ''
)
UPDATE public.product_units 
SET barcode = CASE 
  WHEN ru.rn = 1 THEN product_units.barcode  -- Keep the first occurrence unchanged
  ELSE product_units.barcode || '-U' || lpad(ru.rn::text, 4, '0')  -- Add sequential suffix with 'U' prefix
END
FROM ranked_units ru
WHERE product_units.id = ru.id AND ru.rn > 1;
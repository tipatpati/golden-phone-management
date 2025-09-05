-- First, let's identify and fix the duplicate barcodes more carefully

-- Step 1: Find and fix duplicates in products table
WITH duplicate_products AS (
  SELECT barcode, COUNT(*) as cnt
  FROM public.products 
  WHERE barcode IS NOT NULL AND barcode != ''
  GROUP BY barcode 
  HAVING COUNT(*) > 1
),
ranked_products AS (
  SELECT p.id, p.barcode,
         ROW_NUMBER() OVER (PARTITION BY p.barcode ORDER BY p.created_at ASC, p.id ASC) as rn
  FROM public.products p
  INNER JOIN duplicate_products dp ON dp.barcode = p.barcode
)
UPDATE public.products 
SET barcode = CASE 
  WHEN rp.rn = 1 THEN products.barcode  -- Keep first occurrence unchanged
  ELSE products.barcode || '-' || lpad((abs(hashtext(products.id::text)) % 999)::text, 3, '0')
END
FROM ranked_products rp
WHERE products.id = rp.id AND rp.rn > 1;

-- Step 2: Fix duplicates in product_units table
WITH duplicate_units AS (
  SELECT barcode, COUNT(*) as cnt
  FROM public.product_units 
  WHERE barcode IS NOT NULL AND barcode != ''
  GROUP BY barcode 
  HAVING COUNT(*) > 1
),
ranked_units AS (
  SELECT pu.id, pu.barcode, pu.product_id,
         ROW_NUMBER() OVER (PARTITION BY pu.barcode ORDER BY pu.created_at ASC, pu.id ASC) as rn
  FROM public.product_units pu
  INNER JOIN duplicate_units du ON du.barcode = pu.barcode
)
UPDATE public.product_units 
SET barcode = CASE 
  WHEN ru.rn = 1 THEN product_units.barcode  -- Keep first occurrence unchanged
  ELSE product_units.barcode || '-' || lpad((abs(hashtext(product_units.product_id::text || product_units.id::text)) % 999)::text, 3, '0')
END
FROM ranked_units ru
WHERE product_units.id = ru.id AND ru.rn > 1;

-- Step 3: Now create unique constraints (partial indexes to allow NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_barcode 
ON public.products(barcode) 
WHERE barcode IS NOT NULL AND barcode != '';

CREATE UNIQUE INDEX IF NOT EXISTS ux_product_units_barcode 
ON public.product_units(barcode) 
WHERE barcode IS NOT NULL AND barcode != '';
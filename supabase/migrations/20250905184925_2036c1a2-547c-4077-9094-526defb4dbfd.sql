-- Deduplicate existing duplicate barcodes and enforce uniqueness

-- 1) Deduplicate product_units barcodes by appending a short hash based on product_id for duplicates beyond the first
WITH duplicates AS (
  SELECT barcode
  FROM public.product_units
  WHERE barcode IS NOT NULL
  GROUP BY barcode
  HAVING COUNT(*) > 1
),
ranked AS (
  SELECT pu.id, pu.product_id, pu.barcode,
         ROW_NUMBER() OVER (PARTITION BY pu.barcode ORDER BY pu.created_at, pu.id) AS rn
  FROM public.product_units pu
  JOIN duplicates d ON d.barcode = pu.barcode
)
UPDATE public.product_units pu
SET barcode = pu.barcode || '-' || lpad((abs(hashtext(pu.product_id::text)) % 1000)::text, 3, '0')
FROM ranked r
WHERE pu.id = r.id AND r.rn > 1;

-- 2) Deduplicate products barcodes by appending a short hash based on product id for duplicates beyond the first
WITH prod_duplicates AS (
  SELECT barcode
  FROM public.products
  WHERE barcode IS NOT NULL
  GROUP BY barcode
  HAVING COUNT(*) > 1
),
prod_ranked AS (
  SELECT p.id, p.barcode,
         ROW_NUMBER() OVER (PARTITION BY p.barcode ORDER BY p.created_at, p.id) AS rn
  FROM public.products p
  JOIN prod_duplicates d ON d.barcode = p.barcode
)
UPDATE public.products p
SET barcode = p.barcode || '-D' || lpad((abs(hashtext(p.id::text)) % 1000)::text, 3, '0')
FROM prod_ranked r
WHERE p.id = r.id AND r.rn > 1;

-- 3) Create unique indexes to enforce uniqueness going forward (barcodes may be NULL)
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_units_barcode ON public.product_units(barcode) WHERE barcode IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
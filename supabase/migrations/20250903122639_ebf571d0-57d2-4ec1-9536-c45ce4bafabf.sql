-- Convert storage column from TEXT to INTEGER (GB values)
-- First, update any existing text values to numeric equivalents
UPDATE public.product_units 
SET storage = CASE 
  WHEN storage ILIKE '%16%gb%' THEN '16'
  WHEN storage ILIKE '%32%gb%' THEN '32'
  WHEN storage ILIKE '%64%gb%' THEN '64'
  WHEN storage ILIKE '%128%gb%' THEN '128'
  WHEN storage ILIKE '%256%gb%' THEN '256'
  WHEN storage ILIKE '%512%gb%' THEN '512'
  WHEN storage ILIKE '%1%tb%' OR storage ILIKE '%1024%gb%' THEN '1024'
  ELSE NULL
END
WHERE storage IS NOT NULL;

-- Change column type to INTEGER
ALTER TABLE public.product_units 
ALTER COLUMN storage TYPE INTEGER USING storage::INTEGER;
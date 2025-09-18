-- Fix product condition bug: Change default from 'used' to 'new' and correct existing data

-- 1. Update the default value for condition column to 'new'
ALTER TABLE public.product_units 
ALTER COLUMN condition SET DEFAULT 'new';

-- 2. Update existing units that were incorrectly set to 'used' but should be 'new'
-- Target units from supplier transactions that specified 'new' condition
UPDATE public.product_units 
SET condition = 'new', updated_at = now()
WHERE condition = 'used' 
  AND id IN (
    SELECT DISTINCT (jsonb_array_elements(sti.product_unit_ids)::text)::uuid
    FROM supplier_transaction_items sti
    JOIN supplier_transactions st ON st.id = sti.transaction_id
    WHERE sti.unit_details->>'condition' = 'new'
      OR (sti.unit_details->'entries' IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(sti.unit_details->'entries') AS entry
            WHERE entry->>'condition' = 'new'
          ))
  );

-- 3. Also update units where the condition was not explicitly tracked but came from recent supplier acquisitions
-- (This catches units that may have lost their condition during processing)
UPDATE public.product_units 
SET condition = 'new', updated_at = now()
WHERE condition = 'used' 
  AND purchase_date >= '2024-01-01'  -- Recent acquisitions likely to be new
  AND supplier_id IS NOT NULL;       -- Came from supplier
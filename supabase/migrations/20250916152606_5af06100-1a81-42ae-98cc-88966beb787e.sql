-- Update product units from latest supplier acquisition to have correct condition
-- These units were incorrectly saved as 'used' but should be 'new' as user selected

UPDATE public.product_units 
SET 
  condition = 'new',
  updated_at = now()
WHERE id IN (
  SELECT pu.id 
  FROM public.product_units pu
  JOIN public.supplier_transaction_items sti ON pu.id::text = ANY(
    SELECT jsonb_array_elements_text(sti.product_unit_ids)
  )
  JOIN public.supplier_transactions st ON sti.transaction_id = st.id
  WHERE st.transaction_number = 'SUP-20250916-199163'
  AND pu.condition = 'used'
);
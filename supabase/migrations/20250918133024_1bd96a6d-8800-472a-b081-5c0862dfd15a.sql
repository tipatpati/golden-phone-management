-- Update product units condition to 'new' for specific supplier transactions
UPDATE public.product_units 
SET 
  condition = 'new',
  updated_at = now()
WHERE supplier_id IN (
  SELECT id FROM public.suppliers WHERE id IN (
    SELECT supplier_id FROM public.supplier_transactions 
    WHERE transaction_number IN (
      'SUP-20250916-992612',
      'SUP-20250916-199163', 
      'SUP-20250916-885223'
    )
  )
)
OR id IN (
  SELECT unnest(
    CASE 
      WHEN jsonb_typeof(sti.product_unit_ids) = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(sti.product_unit_ids)::uuid)
      ELSE ARRAY[]::uuid[]
    END
  ) as unit_id
  FROM public.supplier_transaction_items sti
  JOIN public.supplier_transactions st ON sti.transaction_id = st.id
  WHERE st.transaction_number IN (
    'SUP-20250916-992612',
    'SUP-20250916-199163',
    'SUP-20250916-885223'
  )
);
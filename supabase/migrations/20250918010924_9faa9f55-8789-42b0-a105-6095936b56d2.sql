-- Update product units condition based on acquisition transactions
-- Only units from specific transactions should be 'new', rest should be 'used'

UPDATE public.product_units 
SET condition = 'used', updated_at = now()
WHERE id NOT IN (
  -- Find units that were created from the specified transactions
  SELECT DISTINCT pu.id
  FROM public.product_units pu
  JOIN public.supplier_transaction_items sti ON pu.product_id = sti.product_id
  JOIN public.supplier_transactions st ON sti.transaction_id = st.id
  WHERE st.transaction_number IN (
    'SUP-20250916-992612',
    'SUP-20250916-199163', 
    'SUP-20250916-639716'
  )
  AND pu.created_at >= st.transaction_date - INTERVAL '1 day'
  AND pu.created_at <= st.transaction_date + INTERVAL '1 day'
)
AND condition = 'new';

-- Log the update for audit purposes
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_data,
  ip_address
) VALUES (
  auth.uid(),
  'condition_bulk_update',
  jsonb_build_object(
    'operation', 'set_used_condition_for_non_new_acquisitions',
    'excluded_transactions', ARRAY['SUP-20250916-992612', 'SUP-20250916-199163', 'SUP-20250916-639716'],
    'timestamp', now(),
    'reason', 'correct_inventory_condition_based_on_acquisition_source'
  ),
  COALESCE(inet_client_addr(), '0.0.0.0'::inet)
);
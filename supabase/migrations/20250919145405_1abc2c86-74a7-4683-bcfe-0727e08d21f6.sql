-- Create a recovery supplier transaction for the orphaned units using 'purchase' type
INSERT INTO supplier_transactions (
  supplier_id,
  type,
  status,
  total_amount,
  transaction_date,
  transaction_number,
  notes
) VALUES (
  'c5b47e62-9f2b-4bd0-b9d9-25447ab04502',
  'purchase',
  'completed',
  3150.00, -- 7 units * 450 average
  CURRENT_TIMESTAMP,
  'REC-' || extract(epoch from now())::bigint,
  'Recovery transaction for orphaned units from incomplete acquisition - linked to draft data for Ouadah Idriss'
);

-- Update the orphaned units with supplier information
UPDATE product_units 
SET 
  supplier_id = 'c5b47e62-9f2b-4bd0-b9d9-25447ab04502',
  purchase_price = 450.00,
  updated_at = now()
WHERE supplier_id IS NULL 
  AND created_at::date = CURRENT_DATE;
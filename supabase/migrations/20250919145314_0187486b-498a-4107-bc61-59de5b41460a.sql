-- Create a recovery supplier transaction for the orphaned units
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
  'recovery',
  'completed',
  3150.00, -- 7 units * 450 average
  CURRENT_TIMESTAMP,
  'REC-' || extract(epoch from now())::bigint,
  'Recovery transaction for orphaned units from incomplete acquisition - linked to draft data'
);

-- Update the orphaned units with supplier information
UPDATE product_units 
SET 
  supplier_id = 'c5b47e62-9f2b-4bd0-b9d9-25447ab04502',
  purchase_price = 450.00,
  updated_at = now()
WHERE supplier_id IS NULL 
  AND created_at::date = CURRENT_DATE
  AND id IN (
    'e436e603-c8ab-4399-b20b-2268f9fe1d63',
    '842ff291-1a0b-4c55-9020-6ae2fa74d544', 
    '4abbc05f-95ca-4943-ba78-df5deee57125',
    'df25d7b7-9668-4a5d-9987-cb3f8f81f02f',
    'e3b7617e-8c3e-4cbb-b1da-e69957b32e39',
    'dc86cda9-6dcd-4d3f-ac3f-4da06bd274ec',
    '0e6e8205-6c1d-45ad-8c12-0f1294bfa6f3'
  );
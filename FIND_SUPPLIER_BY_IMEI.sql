-- Find supplier for phone with IMEI: 350282719252157

-- Step 1: Find the product unit with this IMEI
SELECT
  pu.id as unit_id,
  pu.imei,
  pu.serial_number,
  pu.status,
  pu.supplier_transaction_id,
  p.brand,
  p.model,
  p.year,
  p.color
FROM product_units pu
JOIN products p ON p.id = pu.product_id
WHERE pu.imei = '350282719252157';

-- Step 2: Get supplier information from the transaction
SELECT
  pu.imei,
  p.brand,
  p.model,
  p.color,
  pu.status,
  pu.purchase_price,
  s.name as supplier_name,
  s.contact_person,
  s.phone as supplier_phone,
  s.email as supplier_email,
  s.address as supplier_address,
  st.transaction_date,
  st.total_amount as transaction_total,
  st.payment_status,
  sti.quantity,
  sti.unit_price
FROM product_units pu
JOIN products p ON p.id = pu.product_id
LEFT JOIN supplier_transaction_items sti ON sti.id = pu.supplier_transaction_item_id
LEFT JOIN supplier_transactions st ON st.id = sti.supplier_transaction_id
LEFT JOIN suppliers s ON s.id = st.supplier_id
WHERE pu.imei = '350282719252157';

-- Step 3: If no result, check if IMEI exists at all
SELECT COUNT(*) as imei_exists
FROM product_units
WHERE imei = '350282719252157';

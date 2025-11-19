-- Move unit 863791074967175 to Main Store
UPDATE product_units
SET 
  store_id = '00000000-0000-0000-0000-000000000001',
  updated_at = now()
WHERE serial_number = '863791074967175';
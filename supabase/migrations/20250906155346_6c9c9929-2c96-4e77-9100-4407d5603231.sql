-- Insert product units for iPhone 13
INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
SELECT 
  p.id,
  unnest(ARRAY['356789012345671','356789012345672','356789012345673']),
  unnest(ARRAY[128,128,256]),
  unnest(ARRAY[4,4,4]),
  unnest(ARRAY[550,560,620]),
  unnest(ARRAY[600,610,680]),
  unnest(ARRAY[750,760,820]),
  unnest(ARRAY['Midnight','Starlight','Blue']),
  unnest(ARRAY[95,92,98]),
  'available'
FROM public.products p 
WHERE p.brand = 'Apple' AND p.model = 'iPhone 13'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_units u 
    WHERE u.product_id = p.id AND u.serial_number = ANY(ARRAY['356789012345671','356789012345672','356789012345673'])
  );

-- Insert product units for Samsung Galaxy S21
INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
SELECT 
  p.id,
  unnest(ARRAY['356789012345681','356789012345682']),
  unnest(ARRAY[128,256]),
  unnest(ARRAY[8,8]),
  unnest(ARRAY[480,520]),
  unnest(ARRAY[520,560]),
  unnest(ARRAY[700,740]),
  unnest(ARRAY['Phantom Gray','Phantom White']),
  unnest(ARRAY[96,93]),
  'available'
FROM public.products p 
WHERE p.brand = 'Samsung' AND p.model = 'Galaxy S21'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_units u 
    WHERE u.product_id = p.id AND u.serial_number = ANY(ARRAY['356789012345681','356789012345682'])
  );

-- Insert product units for Xiaomi Redmi Note 12
INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
SELECT 
  p.id,
  unnest(ARRAY['356789012345691','356789012345692','356789012345693']),
  unnest(ARRAY[128,128,256]),
  unnest(ARRAY[6,6,8]),
  unnest(ARRAY[220,230,260]),
  unnest(ARRAY[250,260,280]),
  unnest(ARRAY[320,330,360]),
  unnest(ARRAY['Onyx Gray','Ice Blue','Mint Green']),
  unnest(ARRAY[97,90,92]),
  'available'
FROM public.products p 
WHERE p.brand = 'Xiaomi' AND p.model = 'Redmi Note 12'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_units u 
    WHERE u.product_id = p.id AND u.serial_number = ANY(ARRAY['356789012345691','356789012345692','356789012345693'])
  );

-- Insert product units for Samsung Galaxy Tab S7
INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
SELECT 
  p.id,
  unnest(ARRAY['356789012345701','356789012345702']),
  unnest(ARRAY[128,256]),
  unnest(ARRAY[6,8]),
  unnest(ARRAY[520,580]),
  unnest(ARRAY[560,620]),
  unnest(ARRAY[740,820]),
  unnest(ARRAY['Mystic Black','Mystic Silver']),
  unnest(ARRAY[94,96]),
  'available'
FROM public.products p 
WHERE p.brand = 'Samsung' AND p.model = 'Galaxy Tab S7'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_units u 
    WHERE u.product_id = p.id AND u.serial_number = ANY(ARRAY['356789012345701','356789012345702'])
  );
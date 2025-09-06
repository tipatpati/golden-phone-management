-- Seed initial categories if they don't exist
INSERT INTO public.categories (name, description)
SELECT x.name, x.description
FROM (VALUES
  ('Smartphones', 'Mobile phones and smartphones'),
  ('Tablets', 'Tablet devices'),
  ('Accessories', 'Device accessories')
) AS x(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.name = x.name
);

-- Helper CTEs to get category IDs
WITH cat AS (
  SELECT 
    (SELECT id FROM public.categories WHERE name = 'Smartphones') AS smartphones_id,
    (SELECT id FROM public.categories WHERE name = 'Tablets') AS tablets_id,
    (SELECT id FROM public.categories WHERE name = 'Accessories') AS accessories_id
)
-- Insert Apple iPhone 13 product (or fetch existing)
, iphone13 AS (
  WITH existing AS (
    SELECT id FROM public.products WHERE brand='Apple' AND model='iPhone 13' LIMIT 1
  ), ins AS (
    INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
    SELECT 'Apple', 'iPhone 13', (SELECT smartphones_id FROM cat), 550, 600, 750, 3, 1, true, 
           ARRAY['356789012345671','356789012345672','356789012345673'], '0123456789012'
    WHERE NOT EXISTS (SELECT 1 FROM existing)
    RETURNING id
  )
  SELECT COALESCE((SELECT id FROM ins), (SELECT id FROM existing)) AS id
)
-- Insert units for iPhone 13
, iphone13_units AS (
  INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
  SELECT 
    (SELECT id FROM iphone13) AS product_id,
    s.serial,
    st.storage,
    r.ram,
    pr.price,
    prmin.min_price,
    prmax.max_price,
    c.color,
    b.battery,
    'available'
  FROM 
    (SELECT UNNEST(ARRAY['356789012345671','356789012345672','356789012345673']) AS serial) s,
    (SELECT UNNEST(ARRAY[128,128,256]) AS storage) st,
    (SELECT UNNEST(ARRAY[4,4,4]) AS ram) r,
    (SELECT UNNEST(ARRAY[550,560,620]) AS price) pr,
    (SELECT UNNEST(ARRAY[600,610,680]) AS min_price) prmin,
    (SELECT UNNEST(ARRAY[750,760,820]) AS max_price) prmax,
    (SELECT UNNEST(ARRAY['Midnight','Starlight','Blue']) AS color) c,
    (SELECT UNNEST(ARRAY[95,92,98]) AS battery) b
  WHERE NOT EXISTS (
    SELECT 1 FROM public.product_units u WHERE u.product_id = (SELECT id FROM iphone13) AND u.serial_number = s.serial
  )
  RETURNING id
)
-- Insert Samsung Galaxy S21 product (or fetch existing)
, s21 AS (
  WITH existing AS (
    SELECT id FROM public.products WHERE brand='Samsung' AND model='Galaxy S21' LIMIT 1
  ), ins AS (
    INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
    SELECT 'Samsung', 'Galaxy S21', (SELECT smartphones_id FROM cat), 480, 520, 700, 2, 1, true, 
           ARRAY['356789012345681','356789012345682'], '0123456789013'
    WHERE NOT EXISTS (SELECT 1 FROM existing)
    RETURNING id
  )
  SELECT COALESCE((SELECT id FROM ins), (SELECT id FROM existing)) AS id
)
-- Insert units for Galaxy S21
, s21_units AS (
  INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
  SELECT 
    (SELECT id FROM s21) AS product_id,
    s.serial,
    st.storage,
    r.ram,
    pr.price,
    prmin.min_price,
    prmax.max_price,
    c.color,
    b.battery,
    'available'
  FROM 
    (SELECT UNNEST(ARRAY['356789012345681','356789012345682']) AS serial) s,
    (SELECT UNNEST(ARRAY[128,256]) AS storage) st,
    (SELECT UNNEST(ARRAY[8,8]) AS ram) r,
    (SELECT UNNEST(ARRAY[480,520]) AS price) pr,
    (SELECT UNNEST(ARRAY[520,560]) AS min_price) prmin,
    (SELECT UNNEST(ARRAY[700,740]) AS max_price) prmax,
    (SELECT UNNEST(ARRAY['Phantom Gray','Phantom White']) AS color) c,
    (SELECT UNNEST(ARRAY[96,93]) AS battery) b
  WHERE NOT EXISTS (
    SELECT 1 FROM public.product_units u WHERE u.product_id = (SELECT id FROM s21) AND u.serial_number = s.serial
  )
  RETURNING id
)
-- Insert Xiaomi Redmi Note 12 product (or fetch existing)
, redmi12 AS (
  WITH existing AS (
    SELECT id FROM public.products WHERE brand='Xiaomi' AND model='Redmi Note 12' LIMIT 1
  ), ins AS (
    INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
    SELECT 'Xiaomi', 'Redmi Note 12', (SELECT smartphones_id FROM cat), 220, 250, 320, 3, 1, true, 
           ARRAY['356789012345691','356789012345692','356789012345693'], '0123456789014'
    WHERE NOT EXISTS (SELECT 1 FROM existing)
    RETURNING id
  )
  SELECT COALESCE((SELECT id FROM ins), (SELECT id FROM existing)) AS id
)
-- Insert units for Redmi Note 12
, redmi12_units AS (
  INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
  SELECT 
    (SELECT id FROM redmi12) AS product_id,
    s.serial,
    st.storage,
    r.ram,
    pr.price,
    prmin.min_price,
    prmax.max_price,
    c.color,
    b.battery,
    'available'
  FROM 
    (SELECT UNNEST(ARRAY['356789012345691','356789012345692','356789012345693']) AS serial) s,
    (SELECT UNNEST(ARRAY[128,128,256]) AS storage) st,
    (SELECT UNNEST(ARRAY[6,6,8]) AS ram) r,
    (SELECT UNNEST(ARRAY[220,230,260]) AS price) pr,
    (SELECT UNNEST(ARRAY[250,260,280]) AS min_price) prmin,
    (SELECT UNNEST(ARRAY[320,330,360]) AS max_price) prmax,
    (SELECT UNNEST(ARRAY['Onyx Gray','Ice Blue','Mint Green']) AS color) c,
    (SELECT UNNEST(ARRAY[97,90,92]) AS battery) b
  WHERE NOT EXISTS (
    SELECT 1 FROM public.product_units u WHERE u.product_id = (SELECT id FROM redmi12) AND u.serial_number = s.serial
  )
  RETURNING id
)
-- Insert Apple AirPods Pro (accessory, no serials)
, airpods AS (
  WITH existing AS (
    SELECT id FROM public.products WHERE brand='Apple' AND model='AirPods Pro' LIMIT 1
  ), ins AS (
    INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
    SELECT 'Apple', 'AirPods Pro', (SELECT accessories_id FROM cat), 180, 190, 250, 10, 2, false, NULL, '0123456789015'
    WHERE NOT EXISTS (SELECT 1 FROM existing)
    RETURNING id
  )
  SELECT COALESCE((SELECT id FROM ins), (SELECT id FROM existing)) AS id
)
-- Insert Samsung Galaxy Tab S7 (tablet, with serials)
, tabS7 AS (
  WITH existing AS (
    SELECT id FROM public.products WHERE brand='Samsung' AND model='Galaxy Tab S7' LIMIT 1
  ), ins AS (
    INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
    SELECT 'Samsung', 'Galaxy Tab S7', (SELECT tablets_id FROM cat), 520, 560, 740, 2, 1, true, 
           ARRAY['356789012345701','356789012345702'], '0123456789016'
    WHERE NOT EXISTS (SELECT 1 FROM existing)
    RETURNING id
  )
  SELECT COALESCE((SELECT id FROM ins), (SELECT id FROM existing)) AS id
)
-- Insert units for Galaxy Tab S7
INSERT INTO public.product_units (product_id, serial_number, storage, ram, price, min_price, max_price, color, battery_level, status)
SELECT 
  (SELECT id FROM tabS7) AS product_id,
  s.serial,
  st.storage,
  r.ram,
  pr.price,
  prmin.min_price,
  prmax.max_price,
  c.color,
  b.battery,
  'available'
FROM 
  (SELECT UNNEST(ARRAY['356789012345701','356789012345702']) AS serial) s,
  (SELECT UNNEST(ARRAY[128,256]) AS storage) st,
  (SELECT UNNEST(ARRAY[6,8]) AS ram) r,
  (SELECT UNNEST(ARRAY[520,580]) AS price) pr,
  (SELECT UNNEST(ARRAY[560,620]) AS min_price) prmin,
  (SELECT UNNEST(ARRAY[740,820]) AS max_price) prmax,
  (SELECT UNNEST(ARRAY['Mystic Black','Mystic Silver']) AS color) c,
  (SELECT UNNEST(ARRAY[94,96]) AS battery) b
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_units u WHERE u.product_id = (SELECT id FROM tabS7) AND u.serial_number = s.serial
);

-- Seed initial categories if they don't exist
INSERT INTO public.categories (name, description)
SELECT 'Smartphones', 'Mobile phones and smartphones'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Smartphones')
UNION ALL
SELECT 'Tablets', 'Tablet devices'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Tablets')
UNION ALL
SELECT 'Accessories', 'Device accessories'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Accessories');

-- Insert Apple iPhone 13
INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
SELECT 'Apple', 'iPhone 13', 
       (SELECT id FROM public.categories WHERE name = 'Smartphones'),
       550, 600, 750, 3, 1, true, 
       ARRAY['356789012345671','356789012345672','356789012345673'], '0123456789012'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE brand='Apple' AND model='iPhone 13');

-- Insert Samsung Galaxy S21
INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
SELECT 'Samsung', 'Galaxy S21', 
       (SELECT id FROM public.categories WHERE name = 'Smartphones'),
       480, 520, 700, 2, 1, true, 
       ARRAY['356789012345681','356789012345682'], '0123456789013'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE brand='Samsung' AND model='Galaxy S21');

-- Insert Xiaomi Redmi Note 12
INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
SELECT 'Xiaomi', 'Redmi Note 12', 
       (SELECT id FROM public.categories WHERE name = 'Smartphones'),
       220, 250, 320, 3, 1, true, 
       ARRAY['356789012345691','356789012345692','356789012345693'], '0123456789014'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE brand='Xiaomi' AND model='Redmi Note 12');

-- Insert Apple AirPods Pro (accessory, no serials)
INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
SELECT 'Apple', 'AirPods Pro', 
       (SELECT id FROM public.categories WHERE name = 'Accessories'),
       180, 190, 250, 10, 2, false, NULL, '0123456789015'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE brand='Apple' AND model='AirPods Pro');

-- Insert Samsung Galaxy Tab S7
INSERT INTO public.products (brand, model, category_id, price, min_price, max_price, stock, threshold, has_serial, serial_numbers, barcode)
SELECT 'Samsung', 'Galaxy Tab S7', 
       (SELECT id FROM public.categories WHERE name = 'Tablets'),
       520, 560, 740, 2, 1, true, 
       ARRAY['356789012345701','356789012345702'], '0123456789016'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE brand='Samsung' AND model='Galaxy Tab S7');
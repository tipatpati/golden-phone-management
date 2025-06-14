
-- Insert categories with conflict handling
INSERT INTO public.categories (name, description) VALUES 
('Electronics', 'Electronic devices and accessories'),
('Computers', 'Laptops, desktops, and computer accessories'),
('Phones', 'Mobile phones and accessories'),
('Audio', 'Headphones, speakers, and audio equipment')
ON CONFLICT (name) DO NOTHING;

-- Now let's add some sample products (only if they don't exist)
INSERT INTO public.products (name, sku, category_id, price, stock, threshold, description, has_serial, barcode, supplier) 
SELECT * FROM (VALUES 
('iPhone 15 Pro', 'IPH15PRO', (SELECT id FROM categories WHERE name = 'Phones'), 999.99, 25, 5, 'Latest iPhone with Pro features', true, '123456789012', 'Apple Inc.'),
('MacBook Pro 14"', 'MBP14', (SELECT id FROM categories WHERE name = 'Computers'), 1999.99, 10, 3, '14-inch MacBook Pro with M3 chip', true, '123456789013', 'Apple Inc.'),
('Samsung Galaxy S24', 'SGS24', (SELECT id FROM categories WHERE name = 'Phones'), 799.99, 30, 8, 'Latest Samsung Galaxy smartphone', true, '123456789014', 'Samsung'),
('Dell XPS 13', 'DXPS13', (SELECT id FROM categories WHERE name = 'Computers'), 1299.99, 15, 5, 'Premium ultrabook laptop', true, '123456789015', 'Dell'),
('AirPods Pro', 'APP3', (SELECT id FROM categories WHERE name = 'Audio'), 249.99, 50, 10, 'Wireless earbuds with noise cancellation', false, '123456789016', 'Apple Inc.'),
('Sony WH-1000XM5', 'SWXM5', (SELECT id FROM categories WHERE name = 'Audio'), 399.99, 20, 5, 'Premium noise-cancelling headphones', false, '123456789017', 'Sony'),
('iPad Air', 'IPAD-AIR', (SELECT id FROM categories WHERE name = 'Electronics'), 599.99, 18, 4, 'Lightweight tablet with powerful performance', true, '123456789018', 'Apple Inc.'),
('Logitech MX Master 3', 'LMX3', (SELECT id FROM categories WHERE name = 'Computers'), 99.99, 40, 10, 'Advanced wireless mouse', false, '123456789019', 'Logitech'),
('USB-C Cable', 'USBC-CABLE', (SELECT id FROM categories WHERE name = 'Electronics'), 19.99, 100, 20, 'High-quality USB-C charging cable', false, '123456789020', 'Generic'),
('Wireless Charger', 'WC-PAD', (SELECT id FROM categories WHERE name = 'Electronics'), 49.99, 35, 8, 'Fast wireless charging pad', false, '123456789021', 'Belkin')
) AS new_products(name, sku, category_id, price, stock, threshold, description, has_serial, barcode, supplier)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = new_products.sku);

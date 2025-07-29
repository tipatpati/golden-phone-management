-- Insert dummy products with new schema structure
INSERT INTO products (brand, model, year, category_id, price, min_price, max_price, stock, threshold, has_serial, description, supplier, barcode, serial_numbers) VALUES
-- Smartphones
('Apple', 'iPhone 15 Pro', 2023, 1, 999.99, 950.00, 1200.00, 15, 5, true, 'Latest iPhone with A17 Pro chip and titanium design', 'Apple Inc.', '123456789012', ARRAY['359876543210987', '359876543210988', '359876543210989']),
('Samsung', 'Galaxy S24 Ultra', 2024, 1, 1199.99, 1100.00, 1300.00, 12, 3, true, 'Premium Android flagship with S Pen and AI features', 'Samsung Electronics', '123456789013', ARRAY['358123456789012', '358123456789013']),
('Google', 'Pixel 8 Pro', 2023, 1, 899.99, 850.00, 950.00, 8, 5, true, 'Google flagship with advanced AI photography', 'Google LLC', '123456789014', ARRAY['357987654321098', '357987654321099']),
('OnePlus', '12 Pro', 2024, 1, 799.99, 750.00, 850.00, 10, 4, true, 'Fast charging flagship with OxygenOS', 'OnePlus Technology', '123456789015', ARRAY['356789012345678']),
('Xiaomi', 'Mi 14 Ultra', 2024, 1, 699.99, 650.00, 750.00, 6, 3, true, 'Photography-focused flagship with Leica partnership', 'Xiaomi Corporation', '123456789016', ARRAY['355678901234567']),

-- Laptops
('Apple', 'MacBook Pro 16"', 2023, 9, 2499.99, 2400.00, 2800.00, 5, 2, true, 'Professional laptop with M3 Max chip', 'Apple Inc.', '223456789012', ARRAY['C02ZX1Y2MD6R', 'C02ZX1Y2MD6S']),
('Dell', 'XPS 15', 2024, 9, 1899.99, 1800.00, 2100.00, 8, 3, true, 'Premium ultrabook with OLED display', 'Dell Technologies', '223456789013', ARRAY['3CGKV53', '3CGKV54']),
('Lenovo', 'ThinkPad X1 Carbon', 2023, 9, 1699.99, 1600.00, 1900.00, 7, 2, true, 'Business ultrabook with legendary keyboard', 'Lenovo Group', '223456789014', ARRAY['PF3DGMN3', 'PF3DGMN4']),
('HP', 'Spectre x360', 2023, 9, 1399.99, 1300.00, 1600.00, 4, 2, true, 'Convertible laptop with premium build', 'HP Inc.', '223456789015', ARRAY['5CD23456AB', '5CD23456AC']),
('ASUS', 'ZenBook Pro 15', 2024, 9, 1599.99, 1500.00, 1800.00, 6, 3, true, 'Creator laptop with OLED ScreenPad', 'ASUSTeK Computer', '223456789016', ARRAY['M5N0CX123456']),

-- Tablets
('Apple', 'iPad Pro 12.9"', 2023, 2, 1099.99, 1000.00, 1300.00, 12, 4, true, 'Professional tablet with M2 chip and Liquid Retina XDR display', 'Apple Inc.', '323456789012', ARRAY['DMPHK2Y2Q', 'DMPHK2Y2R']),
('Samsung', 'Galaxy Tab S9 Ultra', 2023, 2, 1199.99, 1100.00, 1400.00, 8, 3, true, 'Large Android tablet with S Pen included', 'Samsung Electronics', '323456789013', ARRAY['R52RA0WZAZB', 'R52RA0WZAZC']),
('Microsoft', 'Surface Pro 9', 2022, 2, 999.99, 950.00, 1200.00, 6, 2, true, 'Versatile 2-in-1 tablet with Windows 11', 'Microsoft Corporation', '323456789014', ARRAY['045398123456']),

-- Smartwatches
('Apple', 'Watch Series 9', 2023, 3, 399.99, 380.00, 450.00, 20, 8, true, 'Advanced health and fitness tracking', 'Apple Inc.', '423456789012', ARRAY['H9JCH2Y2Q1', 'H9JCH2Y2Q2']),
('Samsung', 'Galaxy Watch 6', 2023, 3, 329.99, 300.00, 380.00, 15, 5, true, 'Comprehensive health monitoring with Wear OS', 'Samsung Electronics', '423456789013', ARRAY['R52RA1WZAZB']),
('Garmin', 'Fenix 7', 2022, 3, 699.99, 650.00, 750.00, 8, 3, true, 'Rugged GPS smartwatch for outdoor adventures', 'Garmin Ltd.', '423456789014', ARRAY['3KG123456789']),

-- Headphones
('Sony', 'WH-1000XM5', 2022, 4, 399.99, 350.00, 450.00, 25, 10, true, 'Industry-leading noise canceling headphones', 'Sony Corporation', '523456789012', ARRAY['1234567890AB', '1234567890AC']),
('Apple', 'AirPods Max', 2020, 4, 549.99, 500.00, 600.00, 12, 5, true, 'Premium over-ear headphones with spatial audio', 'Apple Inc.', '523456789013', ARRAY['HMDT2C1X1', 'HMDT2C1X2']),
('Bose', 'QuietComfort 45', 2021, 4, 329.99, 300.00, 380.00, 18, 8, true, 'Comfortable noise canceling headphones', 'Bose Corporation', '523456789014', ARRAY['059401234567']),

-- Gaming Consoles
('Sony', 'PlayStation 5', 2020, 6, 499.99, 480.00, 550.00, 3, 2, true, 'Next-gen gaming console with 4K gaming', 'Sony Interactive Entertainment', '623456789012', ARRAY['CFI-1116A01234', 'CFI-1116A01235']),
('Microsoft', 'Xbox Series X', 2020, 6, 499.99, 480.00, 550.00, 4, 2, true, 'Most powerful Xbox with 4K/120fps gaming', 'Microsoft Corporation', '623456789013', ARRAY['1914123456789']),
('Nintendo', 'Switch OLED', 2021, 6, 349.99, 330.00, 400.00, 15, 5, true, 'Hybrid gaming console with OLED screen', 'Nintendo Co., Ltd.', '623456789014', ARRAY['XKW10123456789']),

-- Smart Home
('Amazon', 'Echo Dot 5th Gen', 2022, 5, 49.99, 40.00, 60.00, 30, 15, true, 'Compact smart speaker with Alexa', 'Amazon.com Inc.', '723456789012', ARRAY['G070123456789ABC']),
('Google', 'Nest Hub Max', 2019, 5, 229.99, 200.00, 260.00, 12, 5, true, 'Smart display with Google Assistant', 'Google LLC', '723456789013', ARRAY['GA01234567890']),
('Philips', 'Hue Color Bulb', 2023, 5, 49.99, 45.00, 55.00, 50, 20, false, 'Smart color-changing LED bulb', 'Signify N.V.', '723456789014', NULL),

-- Cameras
('Canon', 'EOS R6 Mark II', 2022, 7, 2499.99, 2400.00, 2700.00, 3, 1, true, 'Professional mirrorless camera with 24MP sensor', 'Canon Inc.', '823456789012', ARRAY['0123456789ABC']),
('Sony', 'Alpha A7 IV', 2021, 7, 2499.99, 2400.00, 2700.00, 2, 1, true, 'Full-frame mirrorless with 33MP resolution', 'Sony Corporation', '823456789013', ARRAY['123456789ABCD']),
('Nikon', 'Z9', 2021, 7, 5499.99, 5400.00, 5800.00, 1, 1, true, 'Flagship mirrorless camera with 45.7MP sensor', 'Nikon Corporation', '823456789014', ARRAY['2123456789']);

-- Update stock levels and create some low stock scenarios
UPDATE products SET stock = 2, threshold = 5 WHERE brand = 'Sony' AND model = 'PlayStation 5';
UPDATE products SET stock = 1, threshold = 3 WHERE brand = 'Canon' AND model = 'EOS R6 Mark II';
UPDATE products SET stock = 3, threshold = 5 WHERE brand = 'Apple' AND model = 'Watch Series 9';
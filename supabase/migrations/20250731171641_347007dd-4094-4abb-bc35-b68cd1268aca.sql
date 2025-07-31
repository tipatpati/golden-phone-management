-- Clear existing products and related data
DELETE FROM sale_items;
DELETE FROM repair_parts;
DELETE FROM product_recommendations;
DELETE FROM products;

-- Insert comprehensive product dataset compatible with current architecture
INSERT INTO products (
  category_id, brand, model, year, price, min_price, max_price, 
  stock, threshold, has_serial, serial_numbers, barcode, supplier, description
) VALUES
-- Smartphones (category_id: 1)
(1, 'Apple', 'iPhone 15 Pro Max', 2023, 1199.99, 1150.00, 1299.99, 25, 5, true, 
 ARRAY['359876543210001', '359876543210002', '359876543210003'], '194253000001', 'Apple Inc.', 
 'Latest iPhone with titanium design and A17 Pro chip'),
(1, 'Apple', 'iPhone 15', 2023, 799.99, 750.00, 899.99, 30, 5, true,
 ARRAY['359876543220001', '359876543220002'], '194253000011', 'Apple Inc.',
 'Standard iPhone 15 with Dynamic Island'),
(1, 'Samsung', 'Galaxy S24 Ultra', 2024, 1299.99, 1200.00, 1399.99, 20, 3, true,
 ARRAY['358123456789001', '358123456789002'], '887276789001', 'Samsung Electronics',
 'Flagship Android with S Pen and AI features'),
(1, 'Samsung', 'Galaxy A54', 2023, 449.99, 400.00, 499.99, 35, 8, true,
 ARRAY['358123456799001'], '887276789011', 'Samsung Electronics',
 'Mid-range smartphone with excellent camera'),
(1, 'Google', 'Pixel 8 Pro', 2023, 999.99, 950.00, 1099.99, 15, 3, true,
 ARRAY['357987654321001'], '840244700001', 'Google LLC',
 'Google flagship with advanced AI photography'),
(1, 'OnePlus', '12 Pro', 2024, 899.99, 850.00, 949.99, 18, 4, true,
 ARRAY['356789012345001'], '857154670001', 'OnePlus Technology',
 'Fast charging flagship with OxygenOS'),

-- Accessories (category_id: 2)
(2, 'Apple', 'AirPods Pro 2nd Gen', 2022, 249.99, 230.00, 279.99, 45, 10, true,
 ARRAY['HMDT2C1X001', 'HMDT2C1X002'], 'APL194253000101', 'Apple Inc.',
 'Active noise cancellation with spatial audio'),
(2, 'Apple', 'Watch Series 9', 2023, 399.99, 380.00, 449.99, 25, 5, true,
 ARRAY['H9JCH2Y2Q001', 'H9JCH2Y2Q002'], 'APL194253000201', 'Apple Inc.',
 'Advanced health and fitness tracking'),
(2, 'Samsung', 'Galaxy Buds2 Pro', 2022, 229.99, 200.00, 259.99, 30, 8, true,
 ARRAY['SGB2P001', 'SGB2P002'], 'SAM887276700001', 'Samsung Electronics',
 'Premium wireless earbuds with ANC'),
(2, 'Anker', 'PowerCore 10000', 2023, 29.99, 25.00, 39.99, 50, 15, false,
 NULL, 'ANK848061000001', 'Anker Innovations',
 'Compact portable charger 10000mAh'),

-- Audio Equipment (category_id: 11)
(11, 'Sony', 'WH-1000XM5', 2022, 399.99, 350.00, 449.99, 20, 5, true,
 ARRAY['1234567890AB01', '1234567890AB02'], 'SON490154670001', 'Sony Corporation',
 'Industry-leading noise canceling headphones'),
(11, 'Bose', 'QuietComfort 45', 2021, 329.99, 300.00, 379.99, 15, 3, true,
 ARRAY['059401234567001'], 'BOS017817670001', 'Bose Corporation',
 'Comfortable noise canceling headphones'),
(11, 'Apple', 'AirPods Max', 2020, 549.99, 500.00, 599.99, 12, 3, true,
 ARRAY['HMDT2C1X101', 'HMDT2C1X102'], 'APL194253000301', 'Apple Inc.',
 'Premium over-ear headphones with spatial audio'),
(11, 'JBL', 'Charge 5', 2021, 179.99, 150.00, 199.99, 25, 8, false,
 NULL, 'JBL050036370001', 'Harman International',
 'Portable Bluetooth speaker with powerbank'),

-- Electronics (category_id: 8)
(8, 'Sony', 'PlayStation 5', 2020, 499.99, 480.00, 549.99, 8, 2, true,
 ARRAY['CFI-1116A01001', 'CFI-1116A01002'], 'SON711719540001', 'Sony Interactive Entertainment',
 'Next-gen gaming console with 4K gaming'),
(8, 'Microsoft', 'Xbox Series X', 2020, 499.99, 480.00, 549.99, 6, 2, true,
 ARRAY['1914123456001'], 'MSF889842540001', 'Microsoft Corporation',
 'Most powerful Xbox with 4K/120fps gaming'),
(8, 'Nintendo', 'Switch OLED', 2021, 349.99, 330.00, 399.99, 15, 3, true,
 ARRAY['XKW10123456001'], 'NIN045496890001', 'Nintendo Co., Ltd.',
 'Hybrid gaming console with OLED screen'),
(8, 'Canon', 'EOS R6 Mark II', 2022, 2499.99, 2400.00, 2699.99, 3, 1, true,
 ARRAY['0123456789ABC01'], 'CAN013803340001', 'Canon Inc.',
 'Professional mirrorless camera with 24MP sensor'),
(8, 'Sony', 'Alpha A7 IV', 2021, 2499.99, 2400.00, 2699.99, 4, 1, true,
 ARRAY['123456789ABCD01'], 'SON027242890001', 'Sony Corporation',
 'Full-frame mirrorless with 33MP resolution'),
(8, 'DJI', 'Mini 3 Pro', 2022, 759.99, 700.00, 799.99, 8, 2, true,
 ARRAY['DJI0001', 'DJI0002'], 'DJI633367490001', 'DJI Technology',
 'Compact drone with 4K camera and obstacle avoidance'),
(8, 'Amazon', 'Echo Dot 5th Gen', 2022, 49.99, 40.00, 59.99, 40, 15, true,
 ARRAY['G070123456001'], 'AMZ840080530001', 'Amazon.com Inc.',
 'Compact smart speaker with Alexa'),
(8, 'Google', 'Nest Hub Max', 2019, 229.99, 200.00, 259.99, 12, 3, true,
 ARRAY['GA01234567001'], 'GOO193575020001', 'Google LLC',
 'Smart display with Google Assistant'),

-- Tablets (category_id: 8)
(8, 'Apple', 'iPad Air 5th Gen', 2022, 599.99, 550.00, 649.99, 18, 4, true,
 ARRAY['DMPK2LL/A001', 'DMPK2LL/A002'], 'APL194252000001', 'Apple Inc.',
 'Powerful tablet with M1 chip'),
(8, 'Samsung', 'Galaxy Tab S9', 2023, 799.99, 750.00, 849.99, 12, 3, true,
 ARRAY['SGT9001', 'SGT9002'], 'SAM887276800001', 'Samsung Electronics',
 'Premium Android tablet with S Pen'),

-- Smart Home (category_id: 8)
(8, 'Philips', 'Hue Color Bulb', 2023, 49.99, 45.00, 54.99, 60, 20, false,
 NULL, 'PHI871951430001', 'Signify N.V.',
 'Smart color-changing LED bulb'),
(8, 'Ring', 'Video Doorbell Pro 2', 2021, 249.99, 220.00, 279.99, 15, 5, true,
 ARRAY['RING001', 'RING002'], 'RNG840080540001', 'Amazon.com Inc.',
 'Smart doorbell with advanced motion detection'),
(8, 'Nest', 'Learning Thermostat', 2021, 249.99, 220.00, 279.99, 10, 3, true,
 ARRAY['NEST001'], 'GOO193575021001', 'Google LLC',
 'Smart thermostat that learns your schedule'),

-- Laptops (category_id: 8)
(8, 'Apple', 'MacBook Air M2', 2022, 1199.99, 1100.00, 1299.99, 8, 2, true,
 ARRAY['C02ZM002Q6NV001'], 'APL194252010001', 'Apple Inc.',
 'Thin and light laptop with M2 chip'),
(8, 'Dell', 'XPS 13', 2023, 999.99, 900.00, 1099.99, 6, 2, true,
 ARRAY['DELL001', 'DELL002'], 'DEL884116330001', 'Dell Technologies',
 'Premium ultrabook with InfinityEdge display'),
(8, 'HP', 'Spectre x360', 2023, 1199.99, 1100.00, 1299.99, 5, 2, true,
 ARRAY['HP001'], 'HP190781220001', 'HP Inc.',
 'Convertible laptop with 360-degree hinge');

-- Update categories to ensure they exist
INSERT INTO categories (id, name, description) VALUES 
(1, 'Phones', 'Smartphones and mobile devices')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO categories (id, name, description) VALUES 
(2, 'Accessories', 'Phone and device accessories')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO categories (id, name, description) VALUES 
(8, 'Electronics', 'General electronics and gadgets')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO categories (id, name, description) VALUES 
(11, 'Audio', 'Audio equipment and accessories')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- Add some product recommendations for cross-selling
INSERT INTO product_recommendations (product_id, recommended_product_id, recommendation_type, priority) 
SELECT 
  p1.id, 
  p2.id, 
  'accessory',
  1
FROM products p1 
JOIN products p2 ON p1.brand = p2.brand 
WHERE p1.category_id = 1 AND p2.category_id = 2 
AND p1.id != p2.id
LIMIT 10;
-- Insert sample product recommendations
-- iPhone 15 Pro accessories
INSERT INTO public.product_recommendations (product_id, recommended_product_id, recommendation_type, priority) VALUES
-- iPhone 15 Pro -> AirPods Pro
((SELECT id FROM products WHERE sku = 'IPH15PRO'), (SELECT id FROM products WHERE sku = 'APP3'), 'accessory', 1),
-- iPhone 15 Pro -> Wireless Charger
((SELECT id FROM products WHERE sku = 'IPH15PRO'), (SELECT id FROM products WHERE sku = 'WC-PAD'), 'accessory', 2),
-- iPhone 15 Pro -> USB-C Cable
((SELECT id FROM products WHERE sku = 'IPH15PRO'), (SELECT id FROM products WHERE sku = 'USBC-CABLE'), 'accessory', 3);

-- Samsung Galaxy S24 accessories
INSERT INTO public.product_recommendations (product_id, recommended_product_id, recommendation_type, priority) VALUES
-- Samsung Galaxy S24 -> Sony Headphones
((SELECT id FROM products WHERE sku = 'SGS24'), (SELECT id FROM products WHERE sku = 'SWXM5'), 'accessory', 1),
-- Samsung Galaxy S24 -> Wireless Charger
((SELECT id FROM products WHERE sku = 'SGS24'), (SELECT id FROM products WHERE sku = 'WC-PAD'), 'accessory', 2),
-- Samsung Galaxy S24 -> USB-C Cable
((SELECT id FROM products WHERE sku = 'SGS24'), (SELECT id FROM products WHERE sku = 'USBC-CABLE'), 'accessory', 3);

-- MacBook Pro 14" accessories
INSERT INTO public.product_recommendations (product_id, recommended_product_id, recommendation_type, priority) VALUES
-- MacBook Pro -> Logitech Mouse
((SELECT id FROM products WHERE sku = 'MBP14'), (SELECT id FROM products WHERE sku = 'LMX3'), 'accessory', 1),
-- MacBook Pro -> AirPods Pro
((SELECT id FROM products WHERE sku = 'MBP14'), (SELECT id FROM products WHERE sku = 'APP3'), 'accessory', 2),
-- MacBook Pro -> USB-C Cable
((SELECT id FROM products WHERE sku = 'MBP14'), (SELECT id FROM products WHERE sku = 'USBC-CABLE'), 'accessory', 3);

-- Dell XPS 13 accessories
INSERT INTO public.product_recommendations (product_id, recommended_product_id, recommendation_type, priority) VALUES
-- Dell XPS 13 -> Logitech Mouse
((SELECT id FROM products WHERE sku = 'DXPS13'), (SELECT id FROM products WHERE sku = 'LMX3'), 'accessory', 1),
-- Dell XPS 13 -> Sony Headphones
((SELECT id FROM products WHERE sku = 'DXPS13'), (SELECT id FROM products WHERE sku = 'SWXM5'), 'accessory', 2),
-- Dell XPS 13 -> USB-C Cable
((SELECT id FROM products WHERE sku = 'DXPS13'), (SELECT id FROM products WHERE sku = 'USBC-CABLE'), 'accessory', 3);

-- iPad Air accessories
INSERT INTO public.product_recommendations (product_id, recommended_product_id, recommendation_type, priority) VALUES
-- iPad Air -> AirPods Pro
((SELECT id FROM products WHERE sku = 'IPAD-AIR'), (SELECT id FROM products WHERE sku = 'APP3'), 'accessory', 1),
-- iPad Air -> Wireless Charger
((SELECT id FROM products WHERE sku = 'IPAD-AIR'), (SELECT id FROM products WHERE sku = 'WC-PAD'), 'accessory', 2),
-- iPad Air -> USB-C Cable
((SELECT id FROM products WHERE sku = 'IPAD-AIR'), (SELECT id FROM products WHERE sku = 'USBC-CABLE'), 'accessory', 3);
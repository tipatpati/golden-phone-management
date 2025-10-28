-- Remove "Repairs" from product categories
-- Repairs is a service module, not a product category

-- Step 1: Identify and reassign any remaining products in "Repairs" category
-- Move all remaining products to "Accessories" (category_id: 2)
UPDATE products
SET category_id = 2  -- Accessories
WHERE category_id IN (
  SELECT id FROM categories WHERE LOWER(name) = 'repairs'
);

-- Step 2: Delete the "Repairs" category
DELETE FROM categories
WHERE LOWER(name) = 'repairs';

-- Step 3: Ensure standard categories exist
-- These are the valid product categories
INSERT INTO categories (id, name, description) VALUES
  (1, 'Phones', 'Smartphones and mobile devices'),
  (2, 'Accessories', 'Phone and device accessories, cables, chargers, cases'),
  (3, 'Tablets', 'Tablets and e-readers'),
  (5, 'Computers', 'Laptops, desktops, and computer accessories'),
  (6, 'Wearables', 'Smartwatches and fitness trackers'),
  (7, 'Gaming', 'Gaming consoles and accessories'),
  (8, 'Electronics', 'General electronics and gadgets'),
  (9, 'Smart Home', 'Smart home devices and IoT products'),
  (10, 'Cameras', 'Cameras and photography equipment'),
  (11, 'Audio', 'Audio equipment, headphones, and speakers')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Step 4: Verify no products are orphaned
SELECT
  p.id,
  p.brand,
  p.model,
  p.category_id,
  'Orphaned product - no valid category' as issue
FROM products p
WHERE p.category_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM categories WHERE id = p.category_id);

-- Step 5: Create a comment explaining the fix
COMMENT ON TABLE categories IS
'Product categories for inventory items. Note: Repairs is a service module tracked in the repairs table, not a product category.';

-- Fix: Remove "Repairs" from product categories
-- Repairs is a service/module, not a product category

-- Step 1: Check if "Repairs" category exists and what products use it
SELECT
  c.id as category_id,
  c.name as category_name,
  COUNT(p.id) as products_using_this_category,
  STRING_AGG(p.brand || ' ' || p.model, ', ') as affected_products
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE LOWER(c.name) = 'repairs'
GROUP BY c.id, c.name;

-- Step 2: If products are using "Repairs" category, we need to reassign them
-- First, let's see what valid categories exist
SELECT
  id,
  name,
  description,
  created_at
FROM categories
WHERE LOWER(name) != 'repairs'
ORDER BY name;

-- Step 3: Reassign products from "Repairs" to a more appropriate category
-- (Run this after choosing the correct category ID from Step 2)
-- Example: Reassign to "Accessories" or "Other" category

-- Uncomment and modify with the correct target category_id:
/*
UPDATE products
SET category_id = 1  -- Replace with appropriate category ID
WHERE category_id = (SELECT id FROM categories WHERE LOWER(name) = 'repairs');
*/

-- Step 4: Delete the "Repairs" category
-- (Only run after reassigning all products)
/*
DELETE FROM categories
WHERE LOWER(name) = 'repairs';
*/

-- Step 5: Verify the fix
SELECT
  c.id,
  c.name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

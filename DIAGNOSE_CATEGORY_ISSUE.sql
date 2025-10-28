-- Diagnostic: Check for category display issues in inventory
-- This query helps identify why categories are showing incorrectly in the inventory table

-- Step 1: Check if category_id matches what's displayed
SELECT
  p.id as product_id,
  p.brand,
  p.model,
  p.category_id,
  c.id as actual_category_id,
  c.name as category_name,
  CASE
    WHEN p.category_id = c.id THEN '✅ Match'
    ELSE '❌ Mismatch!'
  END as status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
ORDER BY p.brand, p.model
LIMIT 50;

-- Step 2: Find products with NULL or invalid category_id
SELECT
  p.id,
  p.brand,
  p.model,
  p.category_id,
  'Missing category' as issue
FROM products p
WHERE p.category_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM categories WHERE id = p.category_id);

-- Step 3: Check what categories exist
SELECT
  id,
  name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;

-- Step 4: Test the exact query used by the frontend
-- This mimics line 31 of LightweightInventoryService.ts
SELECT
  p.*,
  jsonb_build_object('id', c.id, 'name', c.name) as category
FROM products p
INNER JOIN categories c ON c.id = p.category_id
ORDER BY p.brand, p.model
LIMIT 20;

-- Step 5: Check for products where category name doesn't match expected
-- (Phones should have 'Smartphones' or 'Phones' category)
SELECT
  p.id,
  p.brand,
  p.model,
  p.category_id,
  c.name as category_name,
  CASE
    WHEN LOWER(p.brand) LIKE '%iphone%'
      OR LOWER(p.brand) LIKE '%samsung%'
      OR LOWER(p.brand) LIKE '%xiaomi%'
      OR LOWER(p.model) LIKE '%phone%'
    THEN 'Likely a phone'
    ELSE 'Not a phone'
  END as detected_type,
  CASE
    WHEN LOWER(c.name) IN ('smartphones', 'phones', 'phone')
    THEN '✅ Correct category'
    ELSE '⚠️ Check this'
  END as category_check
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE LOWER(p.brand) LIKE '%iphone%'
   OR LOWER(p.brand) LIKE '%samsung%'
   OR LOWER(p.brand) LIKE '%xiaomi%'
   OR LOWER(p.model) LIKE '%phone%'
ORDER BY p.brand, p.model;

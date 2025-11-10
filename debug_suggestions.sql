-- Debug query to check what Apple products exist in database

-- Check all Apple products
SELECT id, brand, model, category_id, created_at
FROM products
WHERE brand = 'Apple'
ORDER BY category_id, model;

-- Check count by category
SELECT
  category_id,
  CASE
    WHEN category_id = 1 THEN 'Smartphones'
    WHEN category_id = 2 THEN 'Tablets'
    WHEN category_id = 3 THEN 'Laptops'
    WHEN category_id = 4 THEN 'Accessories'
    ELSE 'Unknown'
  END as category_name,
  COUNT(*) as product_count,
  array_agg(DISTINCT model) as models
FROM products
WHERE brand = 'Apple'
GROUP BY category_id
ORDER BY category_id;

-- Check if any laptops exist (any brand)
SELECT brand, model, category_id
FROM products
WHERE category_id = 3
ORDER BY brand, model;

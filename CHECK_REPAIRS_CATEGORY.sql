-- Check if "Repairs" category exists in the database
SELECT * FROM categories WHERE LOWER(name) = 'repairs';

-- Check if any products are assigned to "Repairs" category
SELECT
  p.id,
  p.brand,
  p.model,
  p.category_id,
  c.name as category_name
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE c.name ILIKE '%repair%';

-- Show all categories
SELECT
  c.id,
  c.name,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.id;

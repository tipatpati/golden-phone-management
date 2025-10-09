-- Fix Samsung Tab A9 category from Accessories to Tablets
UPDATE products 
SET category_id = 3 
WHERE model ILIKE '%Tab%' 
  AND category_id != 3;
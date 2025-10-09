-- Fix accessories that are incorrectly categorized as Repairs (category_id: 4)
-- Move cables, chargers, adapters, and other accessories to the Accessories category (category_id: 2)

UPDATE products 
SET category_id = 2
WHERE category_id = 4 
  AND (
    model ILIKE '%cavo%' OR 
    model ILIKE '%cable%' OR 
    model ILIKE '%charger%' OR 
    model ILIKE '%adapter%' OR 
    model ILIKE '%power adapter%' OR
    model ILIKE '%cuffie%' OR
    model ILIKE '%headphone%' OR
    model ILIKE '%earphone%'
  );
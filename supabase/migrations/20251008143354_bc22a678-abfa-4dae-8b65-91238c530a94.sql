-- Fix incorrect category assignment for HOCO TEST ACC product
-- This product is an accessory but was incorrectly assigned to "Repairs" category
-- Correcting it to "Accessories" category (id: 2)

UPDATE products 
SET category_id = 2,
    updated_at = now()
WHERE id = '2e121823-0659-44f5-9735-768605d024b0' 
  AND brand = 'HOCO' 
  AND model = 'TEST ACC';
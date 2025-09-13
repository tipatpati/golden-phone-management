-- Data sync script to fix hybrid pricing model inconsistencies
-- This will update existing product units and transactions to match the new pricing logic

-- Step 1: Update product units where purchase_price doesn't match the hybrid pricing model
-- For units with individual prices but missing purchase_price
UPDATE product_units 
SET purchase_price = CASE 
  WHEN purchase_price IS NULL OR purchase_price = 0 THEN
    COALESCE(price, (SELECT price FROM products WHERE id = product_units.product_id))
  ELSE purchase_price 
END,
updated_at = now()
WHERE (purchase_price IS NULL OR purchase_price = 0)
AND product_id IN (SELECT id FROM products WHERE has_serial = true);

-- Step 2: Fix product units where price is 0 but should have a value
UPDATE product_units pu
SET price = CASE
  WHEN pu.price IS NULL OR pu.price <= 0 THEN
    COALESCE(pu.purchase_price, p.price, 0)
  ELSE pu.price
END,
updated_at = now()
FROM products p
WHERE pu.product_id = p.id
AND p.has_serial = true
AND (pu.price IS NULL OR pu.price <= 0);

-- Step 3: Update supplier transaction items where unit_cost is inconsistent with product pricing
UPDATE supplier_transaction_items sti
SET unit_cost = CASE
  WHEN sti.unit_cost = 0 OR sti.unit_cost IS NULL THEN
    COALESCE(p.price, 1)
  ELSE sti.unit_cost
END
FROM products p
WHERE sti.product_id = p.id
AND p.has_serial = true
AND (sti.unit_cost = 0 OR sti.unit_cost IS NULL);

-- Step 4: Recalculate total_cost for transaction items based on hybrid pricing
UPDATE supplier_transaction_items sti
SET total_cost = (
  CASE 
    WHEN p.has_serial = true AND jsonb_array_length(sti.product_unit_ids) > 0 THEN
      -- For serialized products, sum individual unit prices + default for remaining
      COALESCE(
        (SELECT SUM(COALESCE(pu.purchase_price, sti.unit_cost))
         FROM product_units pu 
         WHERE pu.id::text = ANY(SELECT jsonb_array_elements_text(sti.product_unit_ids))
        ),
        sti.quantity * sti.unit_cost
      )
    ELSE
      -- For non-serialized products, use quantity * unit_cost
      sti.quantity * sti.unit_cost
  END
)
FROM products p
WHERE sti.product_id = p.id;

-- Step 5: Update transaction totals to match corrected item totals
UPDATE supplier_transactions st
SET total_amount = (
  SELECT SUM(sti.total_cost)
  FROM supplier_transaction_items sti
  WHERE sti.transaction_id = st.id
),
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM supplier_transaction_items sti 
  WHERE sti.transaction_id = st.id
);

-- Step 6: Fix any missing min/max prices for product units
UPDATE product_units pu
SET 
  min_price = CASE 
    WHEN pu.min_price IS NULL OR pu.min_price = 0 THEN 
      GREATEST(COALESCE(pu.purchase_price, pu.price, p.price) * 0.9, 1)
    ELSE pu.min_price 
  END,
  max_price = CASE 
    WHEN pu.max_price IS NULL OR pu.max_price = 0 THEN 
      GREATEST(COALESCE(pu.purchase_price, pu.price, p.price) * 1.3, 1)
    ELSE pu.max_price 
  END,
  updated_at = now()
FROM products p
WHERE pu.product_id = p.id
AND p.has_serial = true
AND (pu.min_price IS NULL OR pu.min_price = 0 OR pu.max_price IS NULL OR pu.max_price = 0);
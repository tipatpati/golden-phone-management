-- Fix pricing synchronization and data integrity issues

-- Step 1: Fix product units where purchase_price is not set correctly from transactions
UPDATE product_units pu
SET purchase_price = CASE 
  WHEN pu.purchase_price IS NULL OR pu.purchase_price = 0 THEN
    -- Get the unit_cost from the most recent supplier transaction item for this unit
    COALESCE(
      (SELECT sti.unit_cost 
       FROM supplier_transaction_items sti 
       WHERE sti.product_id = pu.product_id 
       AND pu.id::text = ANY(SELECT jsonb_array_elements_text(sti.product_unit_ids))
       ORDER BY sti.created_at DESC 
       LIMIT 1),
      pu.price,
      (SELECT price FROM products WHERE id = pu.product_id)
    )
  ELSE pu.purchase_price 
END,
updated_at = now()
WHERE (purchase_price IS NULL OR purchase_price = 0)
AND product_id IN (SELECT id FROM products WHERE has_serial = true);

-- Step 2: Fix units with missing pricing information by using hybrid model
UPDATE product_units pu
SET 
  price = CASE
    WHEN pu.price IS NULL OR pu.price <= 0 THEN
      GREATEST(COALESCE(pu.purchase_price, p.price, 1), 1)
    ELSE pu.price
  END,
  min_price = CASE
    WHEN pu.min_price IS NULL OR pu.min_price <= 0 THEN
      GREATEST(COALESCE(pu.purchase_price, pu.price, p.price) * 0.9, 1)
    ELSE pu.min_price
  END,
  max_price = CASE
    WHEN pu.max_price IS NULL OR pu.max_price <= 0 THEN
      GREATEST(COALESCE(pu.purchase_price, pu.price, p.price) * 1.3, 1)
    ELSE pu.max_price
  END,
  updated_at = now()
FROM products p
WHERE pu.product_id = p.id
AND p.has_serial = true
AND (pu.price IS NULL OR pu.price <= 0 OR pu.min_price IS NULL OR pu.min_price <= 0 OR pu.max_price IS NULL OR pu.max_price <= 0);

-- Step 3: Recalculate supplier transaction item total_cost using hybrid pricing
UPDATE supplier_transaction_items sti
SET total_cost = (
  CASE 
    WHEN p.has_serial = true AND jsonb_array_length(COALESCE(sti.product_unit_ids, '[]'::jsonb)) > 0 THEN
      -- For serialized products with specific units, sum individual unit costs
      COALESCE(
        (SELECT SUM(GREATEST(COALESCE(pu.purchase_price, pu.price, sti.unit_cost), 1))
         FROM product_units pu 
         WHERE pu.id::text = ANY(SELECT jsonb_array_elements_text(sti.product_unit_ids))
        ),
        sti.quantity * sti.unit_cost
      )
    ELSE
      -- For non-serialized products, use quantity * unit_cost
      sti.quantity * sti.unit_cost
  END
FROM products p
WHERE sti.product_id = p.id;

-- Step 4: Update transaction totals to match corrected item totals
UPDATE supplier_transactions st
SET total_amount = (
  SELECT COALESCE(SUM(sti.total_cost), 0)
  FROM supplier_transaction_items sti
  WHERE sti.transaction_id = st.id
),
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM supplier_transaction_items sti 
  WHERE sti.transaction_id = st.id
);
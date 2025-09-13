-- Fix pricing synchronization and data integrity issues

-- Step 1: Fix product units where purchase_price is not set correctly from transactions
UPDATE product_units 
SET purchase_price = CASE 
  WHEN purchase_price IS NULL OR purchase_price = 0 THEN
    -- Get the unit_cost from the most recent supplier transaction item for this unit
    COALESCE(
      (SELECT sti.unit_cost 
       FROM supplier_transaction_items sti 
       WHERE sti.product_id = product_units.product_id 
       AND product_units.id::text = ANY(SELECT jsonb_array_elements_text(sti.product_unit_ids))
       ORDER BY sti.created_at DESC 
       LIMIT 1),
      price,
      (SELECT price FROM products WHERE id = product_units.product_id)
    )
  ELSE purchase_price 
END,
updated_at = now()
WHERE (purchase_price IS NULL OR purchase_price = 0)
AND product_id IN (SELECT id FROM products WHERE has_serial = true);

-- Step 2: Fix units with missing pricing information by using hybrid model
UPDATE product_units 
SET 
  price = CASE
    WHEN price IS NULL OR price <= 0 THEN
      GREATEST(COALESCE(purchase_price, (SELECT price FROM products WHERE id = product_units.product_id), 1), 1)
    ELSE price
  END,
  min_price = CASE
    WHEN min_price IS NULL OR min_price <= 0 THEN
      GREATEST(COALESCE(purchase_price, price, (SELECT price FROM products WHERE id = product_units.product_id)) * 0.9, 1)
    ELSE min_price
  END,
  max_price = CASE
    WHEN max_price IS NULL OR max_price <= 0 THEN
      GREATEST(COALESCE(purchase_price, price, (SELECT price FROM products WHERE id = product_units.product_id)) * 1.3, 1)
    ELSE max_price
  END,
  updated_at = now()
WHERE product_id IN (SELECT id FROM products WHERE has_serial = true)
AND (price IS NULL OR price <= 0 OR min_price IS NULL OR min_price <= 0 OR max_price IS NULL OR max_price <= 0);

-- Step 3: Recalculate supplier transaction item total_cost using hybrid pricing
UPDATE supplier_transaction_items 
SET total_cost = (
  CASE 
    WHEN (SELECT has_serial FROM products WHERE id = supplier_transaction_items.product_id) = true 
    AND jsonb_array_length(COALESCE(product_unit_ids, '[]'::jsonb)) > 0 THEN
      -- For serialized products with specific units, sum individual unit costs
      COALESCE(
        (SELECT SUM(GREATEST(COALESCE(pu.purchase_price, pu.price, supplier_transaction_items.unit_cost), 1))
         FROM product_units pu 
         WHERE pu.id::text = ANY(SELECT jsonb_array_elements_text(supplier_transaction_items.product_unit_ids))
        ),
        quantity * unit_cost
      )
    ELSE
      -- For non-serialized products, use quantity * unit_cost
      quantity * unit_cost
  END
);

-- Step 4: Update transaction totals to match corrected item totals
UPDATE supplier_transactions 
SET total_amount = (
  SELECT COALESCE(SUM(sti.total_cost), 0)
  FROM supplier_transaction_items sti
  WHERE sti.transaction_id = supplier_transactions.id
),
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM supplier_transaction_items sti 
  WHERE sti.transaction_id = supplier_transactions.id
);
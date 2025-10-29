-- Fix stock synchronization issue for product 2e121823-0659-44f5-9735-768605d024b0
-- The UI shows 2 in stock but the database has 0

-- Step 1: Check the current state
SELECT
  p.id,
  p.brand,
  p.model,
  p.year,
  p.has_serial,
  p.stock as "current_stock_in_db",
  p.store_id,
  s.name as store_name,
  -- Check if there are any pending/failed sales with this product
  (
    SELECT COUNT(*)
    FROM sale_items si
    JOIN sales sal ON sal.id = si.sale_id
    WHERE si.product_id = p.id
  ) as "total_sales_count",
  (
    SELECT COALESCE(SUM(si.quantity), 0)
    FROM sale_items si
    JOIN sales sal ON sal.id = si.sale_id
    WHERE si.product_id = p.id
  ) as "total_quantity_sold"
FROM products p
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.id = '2e121823-0659-44f5-9735-768605d024b0';

-- Step 2: Fix the stock value to match reality (2 in stock)
UPDATE products
SET stock = 2
WHERE id = '2e121823-0659-44f5-9735-768605d024b0';

-- Step 3: Verify the fix
SELECT
  id,
  brand,
  model,
  stock as "stock_after_fix",
  get_product_effective_stock(id) as "effective_stock"
FROM products
WHERE id = '2e121823-0659-44f5-9735-768605d024b0';

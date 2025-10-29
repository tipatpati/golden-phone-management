-- Debug query to check stock for the problematic product
-- Replace '2e121823-0659-44f5-9735-768605d024b0' with your product ID

SELECT
  p.id,
  p.brand,
  p.model,
  p.year,
  p.has_serial,
  p.stock as "stock_column_value",
  p.store_id,
  s.name as store_name,
  get_product_effective_stock(p.id) as "effective_stock_function_result",
  (
    SELECT COUNT(*)
    FROM product_units pu
    WHERE pu.product_id = p.id AND pu.status = 'available'
  ) as "available_units_count"
FROM products p
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.id = '2e121823-0659-44f5-9735-768605d024b0';

-- If the product is non-serialized and stock_column_value is 0, fix it:
-- UPDATE products
-- SET stock = 10  -- Set to your desired stock value
-- WHERE id = '2e121823-0659-44f5-9735-768605d024b0';

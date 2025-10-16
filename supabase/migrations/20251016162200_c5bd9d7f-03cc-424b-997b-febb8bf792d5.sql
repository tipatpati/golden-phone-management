-- Fix search_inventory to NOT return all products when search is empty
DROP FUNCTION IF EXISTS search_inventory(TEXT);

CREATE OR REPLACE FUNCTION search_inventory(search_text TEXT)
RETURNS TABLE (
  id UUID,
  brand TEXT,
  model TEXT,
  year INTEGER,
  category_id INTEGER,
  price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  stock INTEGER,
  threshold INTEGER,
  description TEXT,
  supplier TEXT,
  barcode TEXT,
  has_serial BOOLEAN,
  serial_numbers TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  category_name TEXT,
  unit_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return empty result if search text is empty or null
  IF search_text IS NULL OR TRIM(search_text) = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.brand,
    p.model,
    p.year,
    p.category_id,
    p.price,
    p.min_price,
    p.max_price,
    p.stock,
    p.threshold,
    p.description,
    p.supplier,
    p.barcode,
    p.has_serial,
    p.serial_numbers,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pu.id,
          'product_id', pu.product_id,
          'serial_number', pu.serial_number,
          'barcode', pu.barcode,
          'color', pu.color,
          'storage', pu.storage,
          'ram', pu.ram,
          'battery_level', pu.battery_level,
          'status', pu.status,
          'price', pu.price,
          'min_price', pu.min_price,
          'max_price', pu.max_price,
          'condition', pu.condition
        )
      )
      FROM product_units pu
      WHERE pu.product_id = p.id
    ) as unit_data
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN product_units pu ON pu.product_id = p.id
  WHERE 
    p.brand ILIKE '%' || search_text || '%' OR
    p.model ILIKE '%' || search_text || '%' OR
    p.barcode ILIKE '%' || search_text || '%' OR
    COALESCE(p.description, '') ILIKE '%' || search_text || '%' OR
    pu.serial_number ILIKE '%' || search_text || '%' OR
    pu.barcode ILIKE '%' || search_text || '%'
  ORDER BY p.created_at DESC;
END;
$$;
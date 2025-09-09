-- Add validation and fixing functions for product consistency

-- Function to validate cross-module product consistency
CREATE OR REPLACE FUNCTION public.validate_product_consistency()
RETURNS TABLE(
  product_id uuid,
  issue_type text,
  description text,
  severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check products without barcodes
  RETURN QUERY
  SELECT 
    p.id,
    'missing_barcode'::text,
    'Product missing barcode: ' || p.brand || ' ' || p.model,
    'medium'::text
  FROM products p
  WHERE p.barcode IS NULL OR p.barcode = '';
  
  -- Check products with units but has_serial = false
  RETURN QUERY
  SELECT 
    p.id,
    'incorrect_serial_flag'::text,
    'Product has units but has_serial is false: ' || p.brand || ' ' || p.model,
    'high'::text
  FROM products p
  WHERE NOT p.has_serial
    AND EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = p.id);
  
  -- Check product units without barcodes
  RETURN QUERY
  SELECT 
    pu.product_id,
    'unit_missing_barcode'::text,
    'Product unit missing barcode: ' || pu.serial_number,
    'medium'::text
  FROM product_units pu
  WHERE pu.barcode IS NULL OR pu.barcode = '';
  
  -- Check orphaned product units
  RETURN QUERY
  SELECT 
    pu.product_id,
    'orphaned_unit'::text,
    'Product unit references non-existent product: ' || pu.serial_number,
    'critical'::text
  FROM product_units pu
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = pu.product_id);
  
  -- Check duplicate serial numbers
  RETURN QUERY
  SELECT 
    pu.product_id,
    'duplicate_serial'::text,
    'Duplicate serial number: ' || pu.serial_number,
    'high'::text
  FROM product_units pu
  WHERE EXISTS (
    SELECT 1 FROM product_units pu2 
    WHERE pu2.serial_number = pu.serial_number 
      AND pu2.id != pu.id
  );
  
  RETURN;
END;
$$;

-- Function to fix product consistency issues
CREATE OR REPLACE FUNCTION public.fix_product_consistency_issues()
RETURNS TABLE(
  fixed_type text,
  fixed_count integer,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  product_barcode_fixes integer := 0;
  unit_barcode_fixes integer := 0;
  serial_flag_fixes integer := 0;
  product_rec record;
  unit_rec record;
BEGIN
  -- Fix products without barcodes
  FOR product_rec IN 
    SELECT id, brand, model 
    FROM products 
    WHERE barcode IS NULL OR barcode = ''
  LOOP
    UPDATE products 
    SET barcode = generate_and_register_barcode('product', product_rec.id, 'product'),
        updated_at = now()
    WHERE id = product_rec.id;
    
    product_barcode_fixes := product_barcode_fixes + 1;
  END LOOP;
  
  -- Fix product units without barcodes
  FOR unit_rec IN 
    SELECT id, serial_number, product_id 
    FROM product_units 
    WHERE barcode IS NULL OR barcode = ''
  LOOP
    UPDATE product_units 
    SET barcode = generate_and_register_barcode('product_unit', unit_rec.id, 'unit'),
        updated_at = now()
    WHERE id = unit_rec.id;
    
    unit_barcode_fixes := unit_barcode_fixes + 1;
  END LOOP;
  
  -- Fix has_serial flag for products with units
  UPDATE products 
  SET has_serial = true, updated_at = now()
  WHERE NOT has_serial 
    AND EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = products.id);
  
  GET DIAGNOSTICS serial_flag_fixes = ROW_COUNT;
  
  -- Return results
  RETURN QUERY VALUES 
    ('product_barcodes', product_barcode_fixes, 'Fixed missing product barcodes'),
    ('unit_barcodes', unit_barcode_fixes, 'Fixed missing unit barcodes'),
    ('serial_flags', serial_flag_fixes, 'Fixed has_serial flags');
  
  RETURN;
END;
$$;
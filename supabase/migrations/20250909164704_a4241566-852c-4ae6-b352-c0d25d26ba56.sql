-- Create database functions for unified product and product unit coordination

-- Function to generate product barcode and register it atomically
CREATE OR REPLACE FUNCTION public.generate_and_register_barcode(
  p_entity_type text,
  p_entity_id uuid,
  p_barcode_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config_data jsonb;
  prefix text;
  counter_type text;
  new_counter integer;
  new_barcode text;
BEGIN
  -- Get barcode configuration
  SELECT setting_value INTO config_data
  FROM company_settings
  WHERE setting_key = 'barcode_config';
  
  IF config_data IS NULL THEN
    config_data := jsonb_build_object(
      'prefix', 'GPMS',
      'format', 'CODE128',
      'counters', jsonb_build_object('unit', 1000, 'product', 1000)
    );
  END IF;
  
  prefix := config_data->>'prefix';
  
  -- Determine counter type and increment
  IF p_barcode_type = 'unit' THEN
    counter_type := 'unit';
  ELSE
    counter_type := 'product';
  END IF;
  
  -- Atomically increment counter
  SELECT increment_barcode_counter(counter_type) INTO new_counter;
  
  -- Generate barcode
  IF p_barcode_type = 'unit' THEN
    new_barcode := prefix || 'U' || LPAD(new_counter::text, 6, '0');
  ELSE
    new_barcode := prefix || 'P' || LPAD(new_counter::text, 6, '0');
  END IF;
  
  -- Register barcode atomically
  INSERT INTO barcode_registry (
    barcode,
    barcode_type,
    entity_type,
    entity_id,
    format,
    metadata
  ) VALUES (
    new_barcode,
    p_barcode_type,
    p_entity_type,
    p_entity_id,
    'CODE128',
    p_metadata
  );
  
  RETURN new_barcode;
END;
$$;

-- Function to increment barcode counter atomically
CREATE OR REPLACE FUNCTION public.increment_barcode_counter(counter_type text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config_data jsonb;
  current_counters jsonb;
  new_counter integer;
BEGIN
  -- Get current configuration with locking
  SELECT setting_value INTO config_data
  FROM company_settings
  WHERE setting_key = 'barcode_config'
  FOR UPDATE;
  
  IF config_data IS NULL THEN
    config_data := jsonb_build_object(
      'prefix', 'GPMS',
      'format', 'CODE128',
      'counters', jsonb_build_object('unit', 1000, 'product', 1000)
    );
  END IF;
  
  current_counters := config_data->'counters';
  
  -- Increment the specific counter
  IF counter_type = 'unit' THEN
    new_counter := (current_counters->>'unit')::integer + 1;
    current_counters := jsonb_set(current_counters, '{unit}', new_counter::text::jsonb);
  ELSE
    new_counter := (current_counters->>'product')::integer + 1;
    current_counters := jsonb_set(current_counters, '{product}', new_counter::text::jsonb);
  END IF;
  
  -- Update configuration
  config_data := jsonb_set(config_data, '{counters}', current_counters);
  
  UPDATE company_settings
  SET setting_value = config_data, updated_at = now()
  WHERE setting_key = 'barcode_config';
  
  -- Insert if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO company_settings (setting_key, setting_value)
    VALUES ('barcode_config', config_data);
  END IF;
  
  RETURN new_counter;
END;
$$;

-- Function to validate and synchronize product data across modules
CREATE OR REPLACE FUNCTION public.sync_product_data_cross_module()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unit_count integer;
  has_units boolean;
BEGIN
  -- For product updates, ensure data consistency
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Check if product has units
    SELECT COUNT(*) INTO unit_count
    FROM product_units
    WHERE product_id = NEW.id;
    
    has_units := unit_count > 0;
    
    -- Update has_serial flag based on actual units
    IF has_units AND NOT NEW.has_serial THEN
      NEW.has_serial := true;
    END IF;
    
    -- Auto-generate product barcode if missing
    IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
      NEW.barcode := generate_and_register_barcode(
        'product',
        NEW.id,
        'product',
        jsonb_build_object(
          'brand', NEW.brand,
          'model', NEW.model,
          'auto_generated', true,
          'timestamp', now()
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to ensure product unit data integrity
CREATE OR REPLACE FUNCTION public.ensure_product_unit_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  product_record record;
BEGIN
  -- For unit operations, ensure product relationship integrity
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Get product information
    SELECT * INTO product_record
    FROM products
    WHERE id = NEW.product_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
    END IF;
    
    -- Ensure product has_serial is true when units exist
    IF NOT product_record.has_serial THEN
      UPDATE products 
      SET has_serial = true, updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
    
    -- Auto-generate unit barcode if missing
    IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
      NEW.barcode := generate_and_register_barcode(
        'product_unit',
        NEW.id,
        'unit',
        jsonb_build_object(
          'serial_number', NEW.serial_number,
          'product_id', NEW.product_id,
          'auto_generated', true,
          'timestamp', now()
        )
      );
    END IF;
    
    -- Inherit product properties if unit properties are missing
    IF NEW.price IS NULL THEN
      NEW.price := product_record.price;
    END IF;
    
    IF NEW.min_price IS NULL THEN
      NEW.min_price := product_record.min_price;
    END IF;
    
    IF NEW.max_price IS NULL THEN
      NEW.max_price := product_record.max_price;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for cross-module synchronization
DROP TRIGGER IF EXISTS sync_product_data_trigger ON products;
CREATE TRIGGER sync_product_data_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_data_cross_module();

DROP TRIGGER IF EXISTS ensure_unit_integrity_trigger ON product_units;
CREATE TRIGGER ensure_unit_integrity_trigger
  BEFORE INSERT OR UPDATE ON product_units
  FOR EACH ROW
  EXECUTE FUNCTION ensure_product_unit_integrity();

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
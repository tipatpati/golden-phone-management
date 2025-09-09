-- Complete the remaining functions for unified product coordination

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
-- Fix security issues by adding proper search_path to new functions
CREATE OR REPLACE FUNCTION increment_barcode_counter(counter_type text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_config jsonb;
  current_counters jsonb;
  new_counter_value bigint;
BEGIN
  -- Lock and get current config
  SELECT setting_value INTO current_config
  FROM company_settings 
  WHERE setting_key = 'barcode_config'
  FOR UPDATE;
  
  -- Initialize default config if not exists
  IF current_config IS NULL THEN
    current_config := jsonb_build_object(
      'prefix', 'GPMS',
      'format', 'CODE128',
      'counters', jsonb_build_object('unit', 1000, 'product', 1000)
    );
    
    INSERT INTO company_settings (setting_key, setting_value)
    VALUES ('barcode_config', current_config)
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = current_config;
  END IF;
  
  -- Get current counters
  current_counters := current_config->'counters';
  
  -- Increment specific counter
  new_counter_value := COALESCE((current_counters->>counter_type)::bigint, 1000) + 1;
  
  -- Update counters
  current_counters := jsonb_set(current_counters, ARRAY[counter_type], to_jsonb(new_counter_value));
  current_config := jsonb_set(current_config, ARRAY['counters'], current_counters);
  
  -- Save back to database
  UPDATE company_settings 
  SET setting_value = current_config, updated_at = now()
  WHERE setting_key = 'barcode_config';
  
  RETURN new_counter_value;
END;
$$;

CREATE OR REPLACE FUNCTION generate_and_register_barcode(
  p_entity_type text,
  p_entity_id uuid,
  p_barcode_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_data jsonb;
  counter_value bigint;
  type_code text;
  generated_barcode text;
BEGIN
  -- Get atomic counter
  counter_value := increment_barcode_counter(p_barcode_type);
  
  -- Get config for prefix
  SELECT setting_value INTO config_data
  FROM company_settings 
  WHERE setting_key = 'barcode_config';
  
  -- Generate barcode
  type_code := CASE WHEN p_barcode_type = 'unit' THEN 'U' ELSE 'P' END;
  generated_barcode := COALESCE(config_data->>'prefix', 'GPMS') || type_code || LPAD(counter_value::text, 6, '0');
  
  -- Register barcode atomically
  INSERT INTO barcode_registry (
    barcode, barcode_type, entity_type, entity_id, format, metadata
  ) VALUES (
    generated_barcode, p_barcode_type, p_entity_type, p_entity_id, 'CODE128', p_metadata
  );
  
  RETURN generated_barcode;
END;
$$;
-- Drop existing function and recreate with proper type
DROP FUNCTION IF EXISTS public.increment_barcode_counter(text);

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
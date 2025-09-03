-- Create function to validate serial numbers belong to products in sale
CREATE OR REPLACE FUNCTION public.validate_sale_serial_numbers(sale_items_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item jsonb;
  product_serials text[];
  item_serial text;
  product_info record;
BEGIN
  -- Loop through each sale item
  FOR item IN SELECT * FROM jsonb_array_elements(sale_items_data)
  LOOP
    -- Get the serial number from the item (if any)
    item_serial := item->>'serial_number';
    
    -- Skip validation if no serial number provided
    IF item_serial IS NULL OR item_serial = '' THEN
      CONTINUE;
    END IF;
    
    -- Get product details and serial numbers
    SELECT serial_numbers, brand, model INTO product_info
    FROM products 
    WHERE id = (item->>'product_id')::uuid;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', item->>'product_id';
    END IF;
    
    -- Get serial numbers array
    product_serials := product_info.serial_numbers;
    
    -- Check if the serial number belongs to this product
    IF product_serials IS NOT NULL AND array_length(product_serials, 1) > 0 THEN
      IF NOT (item_serial = ANY(product_serials)) THEN
        RAISE EXCEPTION 'Serial number "%" does not belong to product % %. Product serials: %', 
          item_serial,
          product_info.brand,
          product_info.model,
          array_to_string(product_serials, ', ');
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$function$;
-- Fix stock validation snapshot isolation issue in create_sale_transaction
-- Read stock directly within the same transaction context to avoid stale data

CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  sale_data jsonb,
  sale_items_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_id uuid;
  v_item jsonb;
  v_product_has_serial boolean;
  v_available_stock bigint;
  v_serial_number text;
  v_unit_status text;
  v_store_id uuid;
  result jsonb;
BEGIN
  -- Get current store context
  v_store_id := current_setting('app.current_store_id', true)::uuid;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'No store context set. Please select a store first.';
  END IF;

  -- Validate all items before creating sale
  FOR v_item IN SELECT * FROM jsonb_array_elements(sale_items_data)
  LOOP
    -- Get product info
    SELECT has_serial 
    INTO v_product_has_serial
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid
      AND store_id = v_store_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not accessible in current store: %', v_item->>'product_id';
    END IF;

    -- For serialized products, validate serial number
    IF v_product_has_serial THEN
      v_serial_number := v_item->>'serial_number';
      
      IF v_serial_number IS NULL OR v_serial_number = '' THEN
        RAISE EXCEPTION 'Serial number required for serialized product: %', v_item->>'product_id';
      END IF;

      -- Check serial exists and is available
      SELECT status INTO v_unit_status
      FROM product_units
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_serial_number;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Serial number % not found for product %', v_serial_number, v_item->>'product_id';
      END IF;

      IF v_unit_status != 'available' THEN
        RAISE EXCEPTION 'Serial number % is not available (status: %)', v_serial_number, v_unit_status;
      END IF;
    ELSE
      -- For non-serialized products, read stock DIRECTLY to avoid snapshot isolation issues
      -- This ensures we're reading from the current transaction's snapshot, not a stale one
      SELECT 
        CASE 
          WHEN has_serial THEN (
            SELECT COUNT(*)::bigint 
            FROM product_units 
            WHERE product_id = (v_item->>'product_id')::uuid 
            AND status = 'available'
          )
          ELSE stock::bigint
        END
      INTO v_available_stock
      FROM products
      WHERE id = (v_item->>'product_id')::uuid;
      
      IF v_available_stock < (v_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
          v_item->>'product_id',
          v_available_stock,
          (v_item->>'quantity')::integer;
      END IF;
    END IF;
  END LOOP;

  -- Create sale record
  INSERT INTO sales (
    client_id,
    payment_method,
    subtotal_amount,
    tax_amount,
    discount_amount,
    total_amount,
    notes,
    store_id,
    created_by
  ) VALUES (
    (sale_data->>'client_id')::uuid,
    sale_data->>'payment_method',
    (sale_data->>'subtotal_amount')::numeric,
    (sale_data->>'tax_amount')::numeric,
    (sale_data->>'discount_amount')::numeric,
    (sale_data->>'total_amount')::numeric,
    sale_data->>'notes',
    v_store_id,
    auth.uid()
  )
  RETURNING id INTO v_sale_id;

  -- Insert sale items and update inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(sale_items_data)
  LOOP
    -- Insert sale item
    INSERT INTO sale_items (
      sale_id,
      product_id,
      serial_number,
      quantity,
      unit_price,
      subtotal,
      discount_amount,
      tax_amount,
      total_amount
    ) VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      v_item->>'serial_number',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric,
      COALESCE((v_item->>'discount_amount')::numeric, 0),
      COALESCE((v_item->>'tax_amount')::numeric, 0),
      (v_item->>'total_amount')::numeric
    );

    -- Get product serialization status
    SELECT has_serial INTO v_product_has_serial
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid;

    -- Update inventory based on product type
    IF v_product_has_serial THEN
      -- For serialized products, mark unit as sold
      UPDATE product_units
      SET status = 'sold', updated_at = now()
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_item->>'serial_number';
    ELSE
      -- For non-serialized products, decrease stock
      UPDATE products
      SET stock = stock - (v_item->>'quantity')::integer,
          updated_at = now()
      WHERE id = (v_item->>'product_id')::uuid;
    END IF;
  END LOOP;

  -- Return created sale with items
  SELECT jsonb_build_object(
    'sale_id', v_sale_id,
    'success', true
  ) INTO result;

  RETURN result;
END;
$function$;
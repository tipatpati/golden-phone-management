-- Drop all existing signatures of create_sale_transaction
DROP FUNCTION IF EXISTS public.create_sale_transaction(jsonb, jsonb[]) CASCADE;
DROP FUNCTION IF EXISTS public.create_sale_transaction(jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_sale_transaction(p_sale_data jsonb, p_sale_items jsonb[]) CASCADE;

-- Create the corrected function with proper signature
CREATE FUNCTION public.create_sale_transaction(
  sale_data jsonb,
  sale_items_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_store_id uuid;
  v_sale_id uuid;
  v_item jsonb;
  v_product_has_serial boolean;
  v_available_stock integer;
  v_serial_number text;
  v_unit_status text;
BEGIN
  -- Extract store_id from the sale_data payload (NOT from session variable)
  v_store_id := (sale_data->>'store_id')::uuid;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id not provided in sale_data';
  END IF;
  
  -- Validate user has access to this store
  IF NOT public.user_has_store_access(v_store_id) THEN
    RAISE EXCEPTION 'Access denied: User does not have access to store %', v_store_id;
  END IF;

  -- STEP 1: Validate ALL items BEFORE making any changes
  FOR v_item IN SELECT * FROM jsonb_array_elements(sale_items_data)
  LOOP
    -- Get product info and lock the row
    SELECT has_serial, stock
    INTO v_product_has_serial, v_available_stock
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid
      AND store_id = v_store_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not accessible in current store: %', v_item->>'product_id';
    END IF;

    -- Validate based on product type
    IF v_product_has_serial THEN
      -- Serialized: must have serial, quantity=1, unit must be available
      v_serial_number := v_item->>'serial_number';
      
      IF v_serial_number IS NULL OR v_serial_number = '' THEN
        RAISE EXCEPTION 'Serial number required for serialized product: %', v_item->>'product_id';
      END IF;

      IF (v_item->>'quantity')::integer != 1 THEN
        RAISE EXCEPTION 'Serialized products must have quantity = 1';
      END IF;

      SELECT status INTO v_unit_status
      FROM product_units
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_serial_number
        AND store_id = v_store_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Unit not found for serial: %', v_serial_number;
      END IF;

      IF v_unit_status != 'available' THEN
        RAISE EXCEPTION 'Unit not available (status: %): %', v_unit_status, v_serial_number;
      END IF;
    ELSE
      -- Non-serialized: check stock sufficiency
      IF v_available_stock < (v_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
          v_item->>'product_id',
          v_available_stock,
          (v_item->>'quantity')::integer;
      END IF;
    END IF;
  END LOOP;

  -- STEP 2: All validations passed - create the sale
  INSERT INTO sales (
    sale_number,
    store_id,
    client_id,
    salesperson_id,
    status,
    payment_method,
    payment_type,
    cash_amount,
    card_amount,
    bank_transfer_amount,
    discount_amount,
    discount_percentage,
    subtotal,
    tax_amount,
    total_amount,
    vat_included,
    notes
  )
  VALUES (
    sale_data->>'sale_number',
    v_store_id,
    (sale_data->>'client_id')::uuid,
    (sale_data->>'salesperson_id')::uuid,
    COALESCE(sale_data->>'status', 'completed'),
    sale_data->>'payment_method',
    COALESCE(sale_data->>'payment_type', 'single'),
    COALESCE((sale_data->>'cash_amount')::numeric, 0),
    COALESCE((sale_data->>'card_amount')::numeric, 0),
    COALESCE((sale_data->>'bank_transfer_amount')::numeric, 0),
    COALESCE((sale_data->>'discount_amount')::numeric, 0),
    COALESCE((sale_data->>'discount_percentage')::numeric, 0),
    (sale_data->>'subtotal')::numeric,
    (sale_data->>'tax_amount')::numeric,
    (sale_data->>'total_amount')::numeric,
    COALESCE((sale_data->>'vat_included')::boolean, true),
    COALESCE(sale_data->>'notes', '')
  )
  RETURNING id INTO v_sale_id;

  -- STEP 3: Insert sale items AND update stock/status atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(sale_items_data)
  LOOP
    -- Insert sale item
    INSERT INTO sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      serial_number
    )
    VALUES (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      v_item->>'serial_number'
    );

    -- Update stock/status
    SELECT has_serial INTO v_product_has_serial
    FROM products
    WHERE id = (v_item->>'product_id')::uuid;

    IF NOT v_product_has_serial THEN
      -- Non-serialized: decrement stock
      UPDATE products
      SET stock = stock - (v_item->>'quantity')::integer,
          updated_at = now()
      WHERE id = (v_item->>'product_id')::uuid
        AND store_id = v_store_id;
    ELSE
      -- Serialized: mark unit as sold
      UPDATE product_units
      SET status = 'sold',
          updated_at = now()
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_item->>'serial_number'
        AND store_id = v_store_id;
    END IF;
  END LOOP;

  -- STEP 4: Return success
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'store_id', v_store_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Any error rolls back the ENTIRE transaction automatically
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;
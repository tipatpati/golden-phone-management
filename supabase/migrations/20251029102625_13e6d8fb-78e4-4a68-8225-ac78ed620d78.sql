-- Phase 1: Fix create_sale_transaction to set session context explicitly
-- This ensures RLS policies work correctly for product queries

CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_sale_data jsonb,
  p_sale_items jsonb[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_sale_id uuid;
  v_item jsonb;
  v_product_has_serial boolean;
  v_available_stock integer;
  v_unit_status text;
BEGIN
  -- CRITICAL: Set store context for this transaction
  -- This ensures RLS policies see the correct store_id
  v_store_id := get_user_current_store_id();
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Store context not set. User has no assigned stores or session not initialized.';
  END IF;
  
  -- Set session variable explicitly for this function's transaction
  PERFORM set_config('app.current_store_id', v_store_id::text, false);
  
  -- Validate all items BEFORE inserting anything
  FOR v_item IN SELECT * FROM unnest(p_sale_items)
  LOOP
    -- Get product info with explicit store filter as backup
    SELECT has_serial, stock 
    INTO v_product_has_serial, v_available_stock
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid
      AND store_id = v_store_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not accessible in current store: %', v_item->>'product_id';
    END IF;
    
    -- Validate serialized products
    IF v_product_has_serial THEN
      IF v_item->>'serial_number' IS NULL OR v_item->>'serial_number' = '' THEN
        RAISE EXCEPTION 'Serial number required for serialized product';
      END IF;
      
      -- Check unit exists and is available
      SELECT status INTO v_unit_status
      FROM product_units
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_item->>'serial_number'
        AND store_id = v_store_id;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Unit not found for serial: %', v_item->>'serial_number';
      END IF;
      
      IF v_unit_status != 'available' THEN
        RAISE EXCEPTION 'Unit not available (status: %) for serial: %', v_unit_status, v_item->>'serial_number';
      END IF;
      
      -- Serialized items must have quantity = 1
      IF (v_item->>'quantity')::integer != 1 THEN
        RAISE EXCEPTION 'Serialized units must have quantity = 1';
      END IF;
    ELSE
      -- Validate stock for non-serialized products
      IF v_available_stock < (v_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
          v_item->>'product_id',
          v_available_stock,
          (v_item->>'quantity')::integer;
      END IF;
    END IF;
  END LOOP;
  
  -- All validations passed, now create the sale
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
    p_sale_data->>'sale_number',
    v_store_id,  -- Use the verified store_id
    (p_sale_data->>'client_id')::uuid,
    (p_sale_data->>'salesperson_id')::uuid,
    COALESCE(p_sale_data->>'status', 'completed'),
    p_sale_data->>'payment_method',
    COALESCE(p_sale_data->>'payment_type', 'single'),
    COALESCE((p_sale_data->>'cash_amount')::numeric, 0),
    COALESCE((p_sale_data->>'card_amount')::numeric, 0),
    COALESCE((p_sale_data->>'bank_transfer_amount')::numeric, 0),
    COALESCE((p_sale_data->>'discount_amount')::numeric, 0),
    COALESCE((p_sale_data->>'discount_percentage')::numeric, 0),
    (p_sale_data->>'subtotal')::numeric,
    (p_sale_data->>'tax_amount')::numeric,
    (p_sale_data->>'total_amount')::numeric,
    COALESCE((p_sale_data->>'vat_included')::boolean, true),
    COALESCE(p_sale_data->>'notes', '')
  )
  RETURNING id INTO v_sale_id;
  
  -- Insert sale items
  FOR v_item IN SELECT * FROM unnest(p_sale_items)
  LOOP
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
    
    -- Update stock immediately for non-serialized products
    SELECT has_serial INTO v_product_has_serial
    FROM products 
    WHERE id = (v_item->>'product_id')::uuid;
    
    IF NOT v_product_has_serial THEN
      UPDATE products
      SET stock = stock - (v_item->>'quantity')::integer
      WHERE id = (v_item->>'product_id')::uuid
        AND store_id = v_store_id;
    ELSE
      -- Update unit status for serialized products
      UPDATE product_units
      SET status = 'sold'
      WHERE product_id = (v_item->>'product_id')::uuid
        AND serial_number = v_item->>'serial_number'
        AND store_id = v_store_id;
    END IF;
  END LOOP;
  
  -- Return success with sale ID
  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'store_id', v_store_id);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will rollback the entire transaction
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;
-- Fix type mismatch in create_exchange_transaction function
-- The issue is in the CASE statements where TEXT and INTEGER types were being mixed

CREATE OR REPLACE FUNCTION public.create_exchange_transaction(
  exchange_data JSONB,
  trade_in_items_data JSONB,
  new_items_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exchange_id UUID;
  v_new_sale_id UUID;
  v_store_id UUID;
  v_trade_in_item JSONB;
  v_new_item JSONB;
  v_sale_result JSONB;
  v_product_has_serial BOOLEAN;
BEGIN
  -- Extract store_id from exchange_data
  v_store_id := (exchange_data->>'store_id')::UUID;
  
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'store_id not provided in exchange_data';
  END IF;
  
  -- Validate user has access to this store
  IF NOT public.user_has_store_access(v_store_id) THEN
    RAISE EXCEPTION 'Access denied: User does not have access to store %', v_store_id;
  END IF;

  -- STEP 1: Create exchange transaction record
  INSERT INTO public.exchange_transactions (
    store_id,
    client_id,
    salesperson_id,
    trade_in_total,
    trade_in_assessment_notes,
    purchase_total,
    net_difference,
    payment_method,
    cash_amount,
    card_amount,
    bank_transfer_amount,
    status,
    exchange_date,
    notes,
    original_sale_id
  ) VALUES (
    v_store_id,
    (exchange_data->>'client_id')::UUID,
    (exchange_data->>'salesperson_id')::UUID,
    COALESCE((exchange_data->>'trade_in_total')::DECIMAL, 0),
    exchange_data->>'trade_in_assessment_notes',
    COALESCE((exchange_data->>'purchase_total')::DECIMAL, 0),
    (exchange_data->>'net_difference')::DECIMAL,
    exchange_data->>'payment_method',
    COALESCE((exchange_data->>'cash_amount')::DECIMAL, 0),
    COALESCE((exchange_data->>'card_amount')::DECIMAL, 0),
    COALESCE((exchange_data->>'bank_transfer_amount')::DECIMAL, 0),
    COALESCE(exchange_data->>'status', 'completed'),
    COALESCE((exchange_data->>'exchange_date')::TIMESTAMPTZ, NOW()),
    exchange_data->>'notes',
    (exchange_data->>'original_sale_id')::UUID
  )
  RETURNING id INTO v_exchange_id;

  -- STEP 2: Insert trade-in items
  FOR v_trade_in_item IN SELECT * FROM jsonb_array_elements(trade_in_items_data)
  LOOP
    INSERT INTO public.exchange_trade_in_items (
      exchange_id,
      product_id,
      custom_product_description,
      brand,
      model,
      serial_number,
      imei,
      condition,
      assessed_value,
      assessment_notes,
      was_originally_sold_here,
      original_sale_id,
      original_sale_item_id
    ) VALUES (
      v_exchange_id,
      (v_trade_in_item->>'product_id')::UUID,
      v_trade_in_item->>'custom_product_description',
      v_trade_in_item->>'brand',
      v_trade_in_item->>'model',
      v_trade_in_item->>'serial_number',
      v_trade_in_item->>'imei',
      v_trade_in_item->>'condition',
      (v_trade_in_item->>'assessed_value')::DECIMAL,
      v_trade_in_item->>'assessment_notes',
      COALESCE((v_trade_in_item->>'was_originally_sold_here')::BOOLEAN, false),
      (v_trade_in_item->>'original_sale_id')::UUID,
      (v_trade_in_item->>'original_sale_item_id')::UUID
    );
    
    -- If trade-in item is in our catalog, add it to inventory
    IF (v_trade_in_item->>'product_id') IS NOT NULL THEN
      -- Check if product uses serial numbers
      SELECT has_serial INTO v_product_has_serial
      FROM public.products
      WHERE id = (v_trade_in_item->>'product_id')::UUID;
      
      IF v_product_has_serial THEN
        -- Create product unit for serialized trade-in
        INSERT INTO public.product_units (
          product_id,
          store_id,
          serial_number,
          condition,
          status,
          price,
          purchase_price
        ) VALUES (
          (v_trade_in_item->>'product_id')::UUID,
          v_store_id,
          v_trade_in_item->>'serial_number',
          COALESCE(v_trade_in_item->>'condition', 'good'),
          'available',
          (v_trade_in_item->>'assessed_value')::DECIMAL * 1.3, -- Suggested resale price
          (v_trade_in_item->>'assessed_value')::DECIMAL
        );
      ELSE
        -- Increment stock for non-serialized trade-in
        UPDATE public.products
        SET stock = stock + 1,
            updated_at = NOW()
        WHERE id = (v_trade_in_item->>'product_id')::UUID
          AND store_id = v_store_id;
      END IF;
    END IF;
  END LOOP;

  -- STEP 3: Create sale for new items purchased by client (if any)
  IF jsonb_array_length(new_items_data) > 0 THEN
    -- Prepare sale data
    DECLARE
      v_sale_data JSONB;
    BEGIN
      v_sale_data := jsonb_build_object(
        'store_id', v_store_id,
        'client_id', exchange_data->>'client_id',
        'salesperson_id', exchange_data->>'salesperson_id',
        'payment_method', exchange_data->>'payment_method',
        'payment_type', 'single',
        -- FIX: Cast all values to DECIMAL to avoid type mismatch
        'cash_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 
                            THEN (exchange_data->>'cash_amount')::DECIMAL 
                            ELSE 0::DECIMAL END,
        'card_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 
                            THEN (exchange_data->>'card_amount')::DECIMAL 
                            ELSE 0::DECIMAL END,
        'bank_transfer_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 
                                     THEN (exchange_data->>'bank_transfer_amount')::DECIMAL 
                                     ELSE 0::DECIMAL END,
        'subtotal', (exchange_data->>'purchase_total')::DECIMAL,
        'tax_amount', 0::DECIMAL,
        'total_amount', (exchange_data->>'purchase_total')::DECIMAL,
        'discount_amount', 0::DECIMAL,
        'discount_percentage', 0::DECIMAL,
        'vat_included', true,
        'notes', 'Vendita da cambio #' || (SELECT exchange_number FROM public.exchange_transactions WHERE id = v_exchange_id),
        'status', 'completed'
      );
      
      -- Create the sale using existing function
      v_sale_result := public.create_sale_transaction(v_sale_data, new_items_data);
      
      IF NOT (v_sale_result->>'success')::BOOLEAN THEN
        RAISE EXCEPTION 'Failed to create sale for exchange: %', v_sale_result->>'error';
      END IF;
      
      v_new_sale_id := (v_sale_result->>'sale_id')::UUID;
      
      -- Link the sale to the exchange
      UPDATE public.exchange_transactions
      SET new_sale_id = v_new_sale_id
      WHERE id = v_exchange_id;
    END;
  END IF;

  -- STEP 4: Return success with exchange details
  RETURN jsonb_build_object(
    'success', true,
    'exchange_id', v_exchange_id,
    'exchange_number', (SELECT exchange_number FROM public.exchange_transactions WHERE id = v_exchange_id),
    'new_sale_id', v_new_sale_id,
    'store_id', v_store_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Exchange transaction failed: %', SQLERRM;
END;
$$;
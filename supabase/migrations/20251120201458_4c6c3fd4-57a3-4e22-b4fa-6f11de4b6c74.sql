-- Phase 1: Exchange/Cambio Transaction System Database Setup

-- Table: exchange_transactions
-- Stores the main exchange transaction records linking trade-ins and purchases
CREATE TABLE IF NOT EXISTS public.exchange_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_number TEXT UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  salesperson_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Trade-in items (what client brings)
  trade_in_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  trade_in_assessment_notes TEXT,
  
  -- New items (what client buys)
  purchase_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Financial difference
  net_difference DECIMAL(10,2) NOT NULL, -- positive = client pays, negative = client receives
  payment_method TEXT NOT NULL, -- cash, card, bank_transfer, hybrid
  cash_amount DECIMAL(10,2) DEFAULT 0,
  card_amount DECIMAL(10,2) DEFAULT 0,
  bank_transfer_amount DECIMAL(10,2) DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'completed', -- completed, cancelled
  exchange_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  -- Link to original sale if trade-in was previously purchased here
  original_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Link to the new sale created for purchased items
  new_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('completed', 'cancelled')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'hybrid'))
);

-- Table: exchange_trade_in_items
-- Details of items the client is trading in
CREATE TABLE IF NOT EXISTS public.exchange_trade_in_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id UUID NOT NULL REFERENCES public.exchange_transactions(id) ON DELETE CASCADE,
  
  -- Product identification
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  custom_product_description TEXT, -- For items not in our catalog
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  imei TEXT,
  
  -- Assessment
  condition TEXT NOT NULL, -- excellent, good, fair, poor
  assessed_value DECIMAL(10,2) NOT NULL,
  assessment_notes TEXT,
  
  -- If this was previously sold by us
  was_originally_sold_here BOOLEAN NOT NULL DEFAULT FALSE,
  original_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  original_sale_item_id UUID REFERENCES public.sale_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_condition CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  CONSTRAINT positive_assessed_value CHECK (assessed_value > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_store_id ON public.exchange_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_client_id ON public.exchange_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_salesperson_id ON public.exchange_transactions(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_exchange_date ON public.exchange_transactions(exchange_date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_transactions_status ON public.exchange_transactions(status);
CREATE INDEX IF NOT EXISTS idx_exchange_trade_in_items_exchange_id ON public.exchange_trade_in_items(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_trade_in_items_product_id ON public.exchange_trade_in_items(product_id);

-- Function: generate_exchange_number
-- Generates unique exchange numbers in format: EXC-YYYYMMDD-NNNN
CREATE OR REPLACE FUNCTION public.generate_exchange_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  sequence_number INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  prefix TEXT := 'EXC-';
BEGIN
  date_prefix := to_char(CURRENT_DATE, 'YYYYMMDD') || '-';

  WHILE attempt < max_attempts LOOP
    SELECT COALESCE(MAX(CAST(RIGHT(exchange_number, 4) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.exchange_transactions
    WHERE exchange_number LIKE prefix || date_prefix || '%'
      AND length(exchange_number) >= length(prefix || date_prefix) + 4;

    IF sequence_number IS NULL OR sequence_number < 1 THEN
      sequence_number := 1;
    END IF;

    new_number := prefix || date_prefix || LPAD(sequence_number::TEXT, 4, '0');

    IF NOT EXISTS (
      SELECT 1 FROM public.exchange_transactions WHERE exchange_number = new_number
    ) THEN
      RETURN new_number;
    END IF;

    attempt := attempt + 1;
  END LOOP;

  RETURN prefix || date_prefix || LPAD((extract(epoch from now())::int % 10000)::text, 4, '0');
END;
$$;

-- Trigger: Set exchange_number on insert
CREATE OR REPLACE FUNCTION public.set_exchange_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.exchange_number IS NULL OR NEW.exchange_number = '' THEN
    NEW.exchange_number := public.generate_exchange_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_exchange_number
  BEFORE INSERT ON public.exchange_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_exchange_number();

-- Trigger: Update updated_at timestamp
CREATE TRIGGER trg_exchange_transactions_updated_at
  BEFORE UPDATE ON public.exchange_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function: create_exchange_transaction
-- Main function to atomically create a complete exchange transaction
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
        'cash_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 THEN exchange_data->>'cash_amount' ELSE 0 END,
        'card_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 THEN exchange_data->>'card_amount' ELSE 0 END,
        'bank_transfer_amount', CASE WHEN (exchange_data->>'net_difference')::DECIMAL > 0 THEN exchange_data->>'bank_transfer_amount' ELSE 0 END,
        'subtotal', exchange_data->>'purchase_total',
        'tax_amount', 0,
        'total_amount', exchange_data->>'purchase_total',
        'discount_amount', 0,
        'discount_percentage', 0,
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

-- RLS Policies for exchange_transactions
ALTER TABLE public.exchange_transactions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all exchanges
CREATE POLICY "Super admins can view all exchanges"
  ON public.exchange_transactions
  FOR SELECT
  TO authenticated
  USING (get_current_user_role() = 'super_admin'::app_role);

-- Admins and managers can view exchanges from their store
CREATE POLICY "Admins and managers can view store exchanges"
  ON public.exchange_transactions
  FOR SELECT
  TO authenticated
  USING (
    (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role]))
    AND (store_id = get_user_current_store_id())
  );

-- Salespersons can view their own exchanges
CREATE POLICY "Salespersons can view own exchanges"
  ON public.exchange_transactions
  FOR SELECT
  TO authenticated
  USING (
    (get_current_user_role() = 'salesperson'::app_role)
    AND (salesperson_id = auth.uid())
    AND (store_id = get_user_current_store_id())
  );

-- Authorized users can create exchanges
CREATE POLICY "Authorized users can create exchanges"
  ON public.exchange_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]))
    AND ((get_current_user_role() = 'super_admin'::app_role) OR (store_id = get_user_current_store_id()))
  );

-- Only admins can update exchanges
CREATE POLICY "Admins can update exchanges"
  ON public.exchange_transactions
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])
  );

-- Only super admins can delete/cancel exchanges
CREATE POLICY "Super admins can delete exchanges"
  ON public.exchange_transactions
  FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'super_admin'::app_role);

-- RLS Policies for exchange_trade_in_items
ALTER TABLE public.exchange_trade_in_items ENABLE ROW LEVEL SECURITY;

-- Users can view trade-in items if they can view the exchange
CREATE POLICY "Users can view trade-in items from viewable exchanges"
  ON public.exchange_trade_in_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_transactions et
      WHERE et.id = exchange_trade_in_items.exchange_id
        AND (
          (get_current_user_role() = 'super_admin'::app_role)
          OR ((get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role])) AND (et.store_id = get_user_current_store_id()))
          OR ((get_current_user_role() = 'salesperson'::app_role) AND (et.salesperson_id = auth.uid()))
        )
    )
  );

-- System can insert trade-in items
CREATE POLICY "System can insert trade-in items"
  ON public.exchange_trade_in_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can manage trade-in items
CREATE POLICY "Admins can manage trade-in items"
  ON public.exchange_trade_in_items
  FOR ALL
  TO authenticated
  USING (
    get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.exchange_transactions TO authenticated;
GRANT ALL ON public.exchange_trade_in_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_exchange_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_exchange_transaction(JSONB, JSONB, JSONB) TO authenticated;
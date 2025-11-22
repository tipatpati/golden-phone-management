-- ========================================
-- PHASE 1: Exchange Transaction Logging Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.exchange_transaction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id UUID REFERENCES public.exchange_transactions(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_status TEXT NOT NULL CHECK (step_status IN ('started', 'completed', 'failed', 'rolled_back')),
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exchange_log_exchange_id ON public.exchange_transaction_log(exchange_id);
CREATE INDEX idx_exchange_log_status ON public.exchange_transaction_log(step_status);
CREATE INDEX idx_exchange_log_created_at ON public.exchange_transaction_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.exchange_transaction_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their store's exchange logs"
  ON public.exchange_transaction_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exchange_transactions et
      WHERE et.id = exchange_id
      AND et.store_id IN (
        SELECT store_id FROM public.user_stores WHERE user_id = auth.uid()
      )
    )
  );

-- ========================================
-- PHASE 2: Exchange Integrity Validation Function
-- ========================================
CREATE OR REPLACE FUNCTION public.validate_exchange_integrity()
RETURNS TABLE (
  exchange_id UUID,
  issue_type TEXT,
  severity TEXT,
  description TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check 1: Orphaned trade-in items (trade-ins without parent exchange)
  RETURN QUERY
  SELECT 
    eti.exchange_id,
    'orphaned_trade_in'::TEXT as issue_type,
    'error'::TEXT as severity,
    'Trade-in item exists without valid parent exchange'::TEXT as description,
    jsonb_build_object(
      'item_id', eti.id,
      'brand', eti.brand,
      'model', eti.model,
      'serial', eti.serial_number
    ) as details
  FROM public.exchange_trade_in_items eti
  LEFT JOIN public.exchange_transactions et ON et.id = eti.exchange_id
  WHERE et.id IS NULL;

  -- Check 2: Missing inventory for trade-ins (completed exchanges without inventory)
  RETURN QUERY
  SELECT 
    et.id as exchange_id,
    'missing_inventory'::TEXT as issue_type,
    'critical'::TEXT as severity,
    'Trade-in item not found in inventory'::TEXT as description,
    jsonb_build_object(
      'exchange_number', et.exchange_number,
      'trade_in_item', jsonb_build_object(
        'brand', eti.brand,
        'model', eti.model,
        'serial', eti.serial_number
      )
    ) as details
  FROM public.exchange_transactions et
  JOIN public.exchange_trade_in_items eti ON eti.exchange_id = et.id
  WHERE et.status = 'completed'
    AND eti.product_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.product_units pu
      WHERE pu.product_id = eti.product_id
      AND pu.serial_number = eti.serial_number
    );

  -- Check 3: Inconsistent totals
  RETURN QUERY
  SELECT 
    et.id as exchange_id,
    'inconsistent_totals'::TEXT as issue_type,
    'warning'::TEXT as severity,
    'Exchange totals do not match item sums'::TEXT as description,
    jsonb_build_object(
      'exchange_number', et.exchange_number,
      'stored_trade_in_total', et.trade_in_total,
      'calculated_trade_in_total', COALESCE(
        (SELECT SUM(assessed_value) FROM exchange_trade_in_items WHERE exchange_id = et.id),
        0
      )
    ) as details
  FROM public.exchange_transactions et
  WHERE ABS(
    et.trade_in_total - COALESCE(
      (SELECT SUM(assessed_value) FROM exchange_trade_in_items WHERE exchange_id = et.id),
      0
    )
  ) > 0.01;

  -- Check 4: Missing linked sales for completed exchanges
  RETURN QUERY
  SELECT 
    et.id as exchange_id,
    'missing_linked_sale'::TEXT as issue_type,
    'error'::TEXT as severity,
    'Completed exchange missing linked sale'::TEXT as description,
    jsonb_build_object(
      'exchange_number', et.exchange_number,
      'status', et.status
    ) as details
  FROM public.exchange_transactions et
  WHERE et.status = 'completed'
    AND et.new_sale_id IS NULL;

  -- Check 5: Invalid status transitions
  RETURN QUERY
  SELECT 
    et.id as exchange_id,
    'invalid_status'::TEXT as issue_type,
    'warning'::TEXT as severity,
    'Exchange has invalid status'::TEXT as description,
    jsonb_build_object(
      'exchange_number', et.exchange_number,
      'status', et.status
    ) as details
  FROM public.exchange_transactions et
  WHERE et.status NOT IN ('pending', 'completed', 'cancelled');

END;
$$;

-- ========================================
-- PHASE 3: Rollback Exchange Transaction Function
-- ========================================
CREATE OR REPLACE FUNCTION public.rollback_exchange_transaction(
  p_exchange_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exchange RECORD;
  v_trade_in_item RECORD;
  v_result JSONB;
  v_units_restored INT := 0;
  v_units_removed INT := 0;
  v_sale_cancelled BOOLEAN := FALSE;
BEGIN
  -- Log start
  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'rollback_start', 'started', jsonb_build_object('timestamp', now()));

  -- Get exchange details
  SELECT * INTO v_exchange
  FROM public.exchange_transactions
  WHERE id = p_exchange_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exchange not found: %', p_exchange_id;
  END IF;

  IF v_exchange.status = 'cancelled' THEN
    RAISE EXCEPTION 'Exchange already cancelled: %', v_exchange.exchange_number;
  END IF;

  -- Step 1: Cancel linked new sale if it exists
  IF v_exchange.new_sale_id IS NOT NULL THEN
    INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
    VALUES (p_exchange_id, 'cancel_linked_sale', 'started', 
      jsonb_build_object('sale_id', v_exchange.new_sale_id));

    UPDATE public.sales
    SET status = 'cancelled', updated_at = now()
    WHERE id = v_exchange.new_sale_id;

    -- Restore product units that were sold
    UPDATE public.product_units
    SET status = 'available', updated_at = now()
    WHERE id IN (
      SELECT pu.id FROM public.product_units pu
      JOIN public.sale_items si ON si.serial_number = pu.serial_number
      WHERE si.sale_id = v_exchange.new_sale_id
    );

    GET DIAGNOSTICS v_units_restored = ROW_COUNT;
    v_sale_cancelled := TRUE;

    INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
    VALUES (p_exchange_id, 'cancel_linked_sale', 'completed', 
      jsonb_build_object('units_restored', v_units_restored));
  END IF;

  -- Step 2: Remove trade-in items from inventory
  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'remove_trade_in_inventory', 'started', NULL);

  FOR v_trade_in_item IN
    SELECT * FROM public.exchange_trade_in_items
    WHERE exchange_id = p_exchange_id AND product_id IS NOT NULL
  LOOP
    -- Remove product unit if it was added
    DELETE FROM public.product_units
    WHERE product_id = v_trade_in_item.product_id
      AND serial_number = v_trade_in_item.serial_number;

    IF FOUND THEN
      v_units_removed := v_units_removed + 1;

      -- Log to product history
      INSERT INTO public.product_history (
        product_id, operation_type, changed_by, note, new_data
      ) VALUES (
        v_trade_in_item.product_id,
        'exchange_rollback',
        auth.uid()::TEXT,
        'Exchange cancelled - trade-in unit removed',
        jsonb_build_object(
          'exchange_id', p_exchange_id,
          'serial_number', v_trade_in_item.serial_number
        )
      );
    END IF;
  END LOOP;

  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'remove_trade_in_inventory', 'completed', 
    jsonb_build_object('units_removed', v_units_removed));

  -- Step 3: Update exchange status
  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'update_status', 'started', NULL);

  UPDATE public.exchange_transactions
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_exchange_id;

  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'update_status', 'completed', NULL);

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'exchange_id', p_exchange_id,
    'exchange_number', v_exchange.exchange_number,
    'units_restored', v_units_restored,
    'units_removed', v_units_removed,
    'sale_cancelled', v_sale_cancelled
  );

  -- Log completion
  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, details)
  VALUES (p_exchange_id, 'rollback_complete', 'completed', v_result);

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log failure
  INSERT INTO public.exchange_transaction_log (exchange_id, step_name, step_status, error_message)
  VALUES (p_exchange_id, 'rollback_failed', 'failed', SQLERRM);
  
  RAISE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_exchange_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_exchange_transaction(UUID) TO authenticated;
GRANT SELECT, INSERT ON public.exchange_transaction_log TO authenticated;
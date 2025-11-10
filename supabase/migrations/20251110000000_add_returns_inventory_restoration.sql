-- Migration: Complete Returns System with Inventory Restoration
-- Date: 2025-11-10
-- Purpose: Add exchange linking, return status tracking, and automatic inventory restoration

-- =====================================================
-- PART 1: Schema Enhancements
-- =====================================================

-- Add exchange sale linking to sale_returns table
ALTER TABLE sale_returns
ADD COLUMN IF NOT EXISTS exchange_sale_id uuid REFERENCES sales(id),
ADD COLUMN IF NOT EXISTS notes_internal text;

-- Add return tracking to sale_items table
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS return_status text DEFAULT 'not_returned' CHECK (return_status IN ('not_returned', 'partially_returned', 'fully_returned')),
ADD COLUMN IF NOT EXISTS quantity_returned integer DEFAULT 0 CHECK (quantity_returned >= 0);

-- Add constraint to ensure quantity_returned doesn't exceed quantity
ALTER TABLE sale_items
ADD CONSTRAINT sale_items_return_quantity_valid
CHECK (quantity_returned <= quantity);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_returns_exchange_sale_id ON sale_returns(exchange_sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_return_status ON sale_items(return_status);
CREATE INDEX IF NOT EXISTS idx_sale_returns_status ON sale_returns(status);

-- Add comments for documentation
COMMENT ON COLUMN sale_returns.exchange_sale_id IS 'Links to the new sale created when this is an exchange';
COMMENT ON COLUMN sale_returns.notes_internal IS 'Internal staff notes, not shown on receipt';
COMMENT ON COLUMN sale_items.return_status IS 'Tracks if item has been returned: not_returned, partially_returned, fully_returned';
COMMENT ON COLUMN sale_items.quantity_returned IS 'Total quantity of this item that has been returned across all returns';

-- =====================================================
-- PART 2: Inventory Restoration Function
-- =====================================================

CREATE OR REPLACE FUNCTION restore_returned_inventory()
RETURNS TRIGGER AS $$
DECLARE
  return_item RECORD;
  original_sale_item RECORD;
  product RECORD;
  product_unit RECORD;
  units_to_restore integer;
BEGIN
  -- Only process when return is being marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

    RAISE NOTICE 'Processing inventory restoration for return_id: %', NEW.id;

    -- Loop through each return item
    FOR return_item IN
      SELECT sri.*, sri.product_id, sri.quantity, sri.serial_number, sri.return_condition
      FROM sale_return_items sri
      WHERE sri.return_id = NEW.id
    LOOP

      RAISE NOTICE 'Processing return item: product_id=%, quantity=%, serial=%',
        return_item.product_id, return_item.quantity, return_item.serial_number;

      -- Get the original sale item to update return status
      SELECT * INTO original_sale_item
      FROM sale_items
      WHERE id = return_item.sale_item_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Original sale item not found: %', return_item.sale_item_id;
      END IF;

      -- Get product details
      SELECT * INTO product
      FROM products
      WHERE id = return_item.product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', return_item.product_id;
      END IF;

      -- Update sale_items return tracking
      UPDATE sale_items
      SET
        quantity_returned = quantity_returned + return_item.quantity,
        return_status = CASE
          WHEN quantity_returned + return_item.quantity >= quantity THEN 'fully_returned'
          WHEN quantity_returned + return_item.quantity > 0 THEN 'partially_returned'
          ELSE 'not_returned'
        END,
        updated_at = now()
      WHERE id = return_item.sale_item_id;

      -- Restore inventory based on product type
      IF product.has_serial THEN
        -- SERIALIZED PRODUCT: Update product_unit status

        IF return_item.serial_number IS NULL THEN
          RAISE EXCEPTION 'Serial number required for serialized product return: %', product.id;
        END IF;

        -- Find the product unit by serial number
        SELECT * INTO product_unit
        FROM product_units
        WHERE serial_number = return_item.serial_number
          AND product_id = return_item.product_id;

        IF NOT FOUND THEN
          RAISE WARNING 'Product unit not found for serial: %. Creating audit entry.', return_item.serial_number;
          -- Continue processing other items instead of failing
          CONTINUE;
        END IF;

        -- Update unit status based on return condition
        UPDATE product_units
        SET
          status = CASE return_item.return_condition
            WHEN 'new' THEN 'available'
            WHEN 'good' THEN 'available'
            WHEN 'damaged' THEN 'damaged'
            WHEN 'defective' THEN 'damaged'
            ELSE 'damaged'
          END,
          condition = CASE
            WHEN return_item.return_condition IN ('damaged', 'defective') THEN 'used'
            ELSE condition  -- Keep existing condition
          END,
          updated_at = now()
        WHERE id = product_unit.id;

        RAISE NOTICE 'Updated product unit status: serial=%, new_status=%',
          return_item.serial_number,
          CASE return_item.return_condition
            WHEN 'new' THEN 'available'
            WHEN 'good' THEN 'available'
            ELSE 'damaged'
          END;

      ELSE
        -- NON-SERIALIZED PRODUCT: Increment stock

        units_to_restore := return_item.quantity;

        -- Only restore to available stock if condition is good
        IF return_item.return_condition IN ('new', 'good') THEN
          UPDATE products
          SET
            stock = stock + units_to_restore,
            updated_at = now()
          WHERE id = return_item.product_id;

          RAISE NOTICE 'Restored stock: product_id=%, units=%',
            return_item.product_id, units_to_restore;
        ELSE
          -- For damaged/defective items, log but don't restore to available stock
          RAISE NOTICE 'Returned item marked as damaged/defective, not restoring to available stock: product_id=%',
            return_item.product_id;
        END IF;

      END IF;

    END LOOP;

    -- Update the original sale status if fully returned
    DECLARE
      all_items_returned boolean;
    BEGIN
      SELECT bool_and(return_status = 'fully_returned')
      INTO all_items_returned
      FROM sale_items
      WHERE sale_id = NEW.sale_id;

      IF all_items_returned THEN
        UPDATE sales
        SET
          status = 'refunded',
          updated_at = now()
        WHERE id = NEW.sale_id;

        RAISE NOTICE 'Sale fully returned, updated status to refunded: sale_id=%', NEW.sale_id;
      END IF;
    END;

    RAISE NOTICE 'Inventory restoration completed for return_id: %', NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: Trigger Setup
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_restore_returned_inventory ON sale_returns;

-- Create trigger for inventory restoration
CREATE TRIGGER trigger_restore_returned_inventory
AFTER UPDATE ON sale_returns
FOR EACH ROW
EXECUTE FUNCTION restore_returned_inventory();

-- =====================================================
-- PART 4: Validation Function for Returns
-- =====================================================

CREATE OR REPLACE FUNCTION validate_return_items(
  p_sale_id uuid,
  p_return_items jsonb
)
RETURNS jsonb AS $$
DECLARE
  validation_result jsonb := '{"valid": true, "errors": []}'::jsonb;
  item jsonb;
  sale_item RECORD;
  total_returned integer;
  error_messages text[] := ARRAY[]::text[];
BEGIN

  -- Validate each return item
  FOR item IN SELECT * FROM jsonb_array_elements(p_return_items)
  LOOP
    -- Get the original sale item
    SELECT * INTO sale_item
    FROM sale_items
    WHERE id = (item->>'sale_item_id')::uuid
      AND sale_id = p_sale_id;

    IF NOT FOUND THEN
      error_messages := array_append(error_messages,
        'Sale item not found: ' || (item->>'sale_item_id'));
      CONTINUE;
    END IF;

    -- Calculate total quantity already returned plus this return
    total_returned := sale_item.quantity_returned + (item->>'quantity')::integer;

    -- Validate quantity
    IF total_returned > sale_item.quantity THEN
      error_messages := array_append(error_messages,
        format('Cannot return %s units - only %s units remaining (original: %s, already returned: %s)',
          (item->>'quantity')::integer,
          sale_item.quantity - sale_item.quantity_returned,
          sale_item.quantity,
          sale_item.quantity_returned
        ));
    END IF;

    -- Validate serial number for serialized products
    IF sale_item.serial_number IS NOT NULL THEN
      IF item->>'serial_number' IS NULL OR item->>'serial_number' != sale_item.serial_number THEN
        error_messages := array_append(error_messages,
          format('Serial number mismatch for sale item %s', sale_item.id));
      END IF;
    END IF;

  END LOOP;

  -- Build result
  IF array_length(error_messages, 1) > 0 THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(error_messages)
    );
  END IF;

  RETURN validation_result;

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 5: Helper Functions
-- =====================================================

-- Function to get return eligibility for a sale
CREATE OR REPLACE FUNCTION get_return_eligibility(p_sale_id uuid)
RETURNS jsonb AS $$
DECLARE
  sale RECORD;
  days_since_sale integer;
  result jsonb;
BEGIN

  SELECT * INTO sale
  FROM sales
  WHERE id = p_sale_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Sale not found');
  END IF;

  -- Check sale status
  IF sale.status IN ('cancelled', 'refunded') THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Sale is already ' || sale.status
    );
  END IF;

  -- Calculate days since sale
  days_since_sale := EXTRACT(DAY FROM (now() - sale.sale_date));

  -- Check if any items can still be returned
  DECLARE
    has_returnable_items boolean;
  BEGIN
    SELECT EXISTS(
      SELECT 1
      FROM sale_items
      WHERE sale_id = p_sale_id
        AND return_status != 'fully_returned'
    ) INTO has_returnable_items;

    IF NOT has_returnable_items THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'All items have been fully returned'
      );
    END IF;
  END;

  -- Return eligibility info
  result := jsonb_build_object(
    'eligible', true,
    'days_since_sale', days_since_sale,
    'restocking_fee_applicable', days_since_sale > 14,
    'sale_date', sale.sale_date,
    'sale_status', sale.status
  );

  RETURN result;

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 6: Update RLS Policies
-- =====================================================

-- Ensure sale_returns has proper RLS policies
ALTER TABLE sale_returns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view returns from their store" ON sale_returns;
DROP POLICY IF EXISTS "Users can create returns for their store" ON sale_returns;
DROP POLICY IF EXISTS "Users can update returns from their store" ON sale_returns;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view returns from their store"
  ON sale_returns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_returns.sale_id
        AND s.store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can create returns for their store"
  ON sale_returns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_returns.sale_id
        AND s.store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update returns from their store"
  ON sale_returns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_returns.sale_id
        AND s.store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        )
    )
  );

-- Ensure sale_return_items has proper RLS
ALTER TABLE sale_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage return items from their store" ON sale_return_items;

CREATE POLICY "Users can manage return items from their store"
  ON sale_return_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sale_returns sr
      JOIN sales s ON s.id = sr.sale_id
      WHERE sr.id = sale_return_items.return_id
        AND s.store_id IN (
          SELECT store_id FROM user_stores WHERE user_id = auth.uid()
        )
    )
  );

-- =====================================================
-- PART 7: Grant Permissions
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION restore_returned_inventory() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_return_items(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_return_eligibility(uuid) TO authenticated;

-- =====================================================
-- Comments and Documentation
-- =====================================================

COMMENT ON FUNCTION restore_returned_inventory() IS
'Automatically restores inventory when a return is marked as completed.
For serialized products: updates product_units status based on return condition.
For non-serialized products: increments stock count (only for good condition items).
Updates sale_items return tracking and sale status.';

COMMENT ON FUNCTION validate_return_items(uuid, jsonb) IS
'Validates return items before creating a return. Checks quantities, serial numbers, and prevents over-returning.';

COMMENT ON FUNCTION get_return_eligibility(uuid) IS
'Checks if a sale is eligible for returns. Returns eligibility status, days since sale, and restocking fee applicability.';

COMMENT ON TRIGGER trigger_restore_returned_inventory ON sale_returns IS
'Triggers inventory restoration when a return status changes to completed';

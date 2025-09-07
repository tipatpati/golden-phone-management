-- Phase 1: Database Foundation Cleanup
-- 1) Create/attach triggers for numbering, stock, unit status, validations, histories
-- 2) Add robust sold_product_units synchronization from sale_items
-- 3) Add indexes for performance
-- 4) Add effective stock view

-- ===============================
-- Helper: updated_at triggers
-- ===============================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_units_updated_at ON public.product_units;
CREATE TRIGGER update_product_units_updated_at
BEFORE UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sale_items_updated_at ON public.sale_items;
CREATE TRIGGER update_sale_items_updated_at
BEFORE UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================
-- Sales numbering
-- ==================================
DROP TRIGGER IF EXISTS set_sale_number_before_insert ON public.sales;
CREATE TRIGGER set_sale_number_before_insert
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.set_sale_number();

-- ==================================
-- Repairs numbering
-- ==================================
DROP TRIGGER IF EXISTS set_repair_number_before_insert ON public.repairs;
CREATE TRIGGER set_repair_number_before_insert
BEFORE INSERT ON public.repairs
FOR EACH ROW
EXECUTE FUNCTION public.set_repair_number();

-- ==================================
-- Supplier transactions numbering
-- ==================================
DROP TRIGGER IF EXISTS set_transaction_number_before_insert ON public.supplier_transactions;
CREATE TRIGGER set_transaction_number_before_insert
BEFORE INSERT ON public.supplier_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_transaction_number();

-- ==================================
-- Product history logging
-- ==================================
DROP TRIGGER IF EXISTS log_product_changes_trigger ON public.products;
CREATE TRIGGER log_product_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.log_product_changes();

DROP TRIGGER IF EXISTS log_product_unit_changes_trigger ON public.product_units;
CREATE TRIGGER log_product_unit_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.log_product_unit_changes();

-- ==================================
-- Product units validations
-- ==================================
DROP TRIGGER IF EXISTS validate_unique_product_unit_identifiers_trigger ON public.product_units;
CREATE TRIGGER validate_unique_product_unit_identifiers_trigger
BEFORE INSERT OR UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.validate_unique_product_unit_identifiers();

DROP TRIGGER IF EXISTS validate_unit_pricing_trigger ON public.product_units;
CREATE TRIGGER validate_unit_pricing_trigger
BEFORE INSERT OR UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.validate_unit_pricing();

-- ==================================
-- Product stock management from sale_items
-- ==================================
DROP TRIGGER IF EXISTS sale_items_stock_on_insert ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_stock_on_update ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_stock_on_delete ON public.sale_items;
CREATE TRIGGER sale_items_stock_on_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();
CREATE TRIGGER sale_items_stock_on_update
AFTER UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();
CREATE TRIGGER sale_items_stock_on_delete
AFTER DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

-- ==================================
-- Product unit status management from sale_items
-- ==================================
DROP TRIGGER IF EXISTS sale_items_unit_status_on_insert ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_unit_status_on_update ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_unit_status_on_delete ON public.sale_items;
CREATE TRIGGER sale_items_unit_status_on_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();
CREATE TRIGGER sale_items_unit_status_on_update
AFTER UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();
CREATE TRIGGER sale_items_unit_status_on_delete
AFTER DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();

-- ==================================
-- Sold product units synchronization (new function + triggers)
-- ==================================
CREATE OR REPLACE FUNCTION public.create_sold_product_unit_from_sale_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_unit_id uuid;
  v_barcode text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
      SELECT id, barcode INTO v_unit_id, v_barcode
      FROM public.product_units
      WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
      LIMIT 1;

      IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
      END IF;

      INSERT INTO public.sold_product_units (
        sale_id, sale_item_id, product_id, product_unit_id, serial_number, barcode, sold_price, sold_at
      ) VALUES (
        NEW.sale_id, NEW.id, NEW.product_id, v_unit_id, btrim(NEW.serial_number), v_barcode, NEW.unit_price, now()
      )
      ON CONFLICT (sale_item_id) DO UPDATE SET
        product_id = EXCLUDED.product_id,
        product_unit_id = EXCLUDED.product_unit_id,
        serial_number = EXCLUDED.serial_number,
        barcode = EXCLUDED.barcode,
        sold_price = EXCLUDED.sold_price,
        updated_at = now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.serial_number IS DISTINCT FROM NEW.serial_number) OR (OLD.unit_price IS DISTINCT FROM NEW.unit_price) THEN
      IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
        SELECT id, barcode INTO v_unit_id, v_barcode
        FROM public.product_units
        WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
        LIMIT 1;

        IF v_unit_id IS NULL THEN
          RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
        END IF;

        INSERT INTO public.sold_product_units (
          sale_id, sale_item_id, product_id, product_unit_id, serial_number, barcode, sold_price, sold_at
        ) VALUES (
          NEW.sale_id, NEW.id, NEW.product_id, v_unit_id, btrim(NEW.serial_number), v_barcode, NEW.unit_price, now()
        )
        ON CONFLICT (sale_item_id) DO UPDATE SET
          product_id = EXCLUDED.product_id,
          product_unit_id = EXCLUDED.product_unit_id,
          serial_number = EXCLUDED.serial_number,
          barcode = EXCLUDED.barcode,
          sold_price = EXCLUDED.sold_price,
          updated_at = now();
      ELSE
        -- If serial removed, delete record
        DELETE FROM public.sold_product_units WHERE sale_item_id = NEW.id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.sold_product_units WHERE sale_item_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for sold_product_units sync
DROP TRIGGER IF EXISTS sale_items_to_sold_units_after_insert ON public.sale_items;
CREATE TRIGGER sale_items_to_sold_units_after_insert
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.create_sold_product_unit_from_sale_item();

DROP TRIGGER IF EXISTS sale_items_to_sold_units_after_update ON public.sale_items;
CREATE TRIGGER sale_items_to_sold_units_after_update
AFTER UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.create_sold_product_unit_from_sale_item();

DROP TRIGGER IF EXISTS sale_items_to_sold_units_after_delete ON public.sale_items;
CREATE TRIGGER sale_items_to_sold_units_after_delete
AFTER DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.create_sold_product_unit_from_sale_item();

-- ==================================
-- Performance indexes
-- ==================================
CREATE INDEX IF NOT EXISTS idx_product_units_product_status ON public.product_units (product_id, status);
CREATE INDEX IF NOT EXISTS idx_product_units_serial ON public.product_units (serial_number);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sold_product_units_sale_item_id ON public.sold_product_units (sale_item_id);
CREATE INDEX IF NOT EXISTS idx_sold_product_units_product_id ON public.sold_product_units (product_id);
CREATE INDEX IF NOT EXISTS idx_sold_product_units_serial ON public.sold_product_units (serial_number);

-- ==================================
-- Effective stock view
-- ==================================
CREATE OR REPLACE VIEW public.product_effective_stock AS
SELECT 
  p.id AS product_id,
  CASE 
    WHEN p.has_serial THEN (
      SELECT COUNT(*) FROM public.product_units pu WHERE pu.product_id = p.id AND pu.status = 'available'
    )
    ELSE p.stock
  END AS effective_stock
FROM public.products p;

-- ==================================
-- Realtime completeness (optional, safe)
-- ==================================
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_units REPLICA IDENTITY FULL;
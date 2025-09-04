-- Ensure sale_items stock and unit status sync with inventory
-- 1) Create function to update product_units status on sale item changes
CREATE OR REPLACE FUNCTION public.update_product_unit_status_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Handle INSERT: mark unit as sold
  IF TG_OP = 'INSERT' THEN
    IF NEW.serial_number IS NOT NULL AND NEW.serial_number <> '' THEN
      UPDATE public.product_units
      SET status = 'sold', updated_at = now()
      WHERE product_id = NEW.product_id AND serial_number = NEW.serial_number;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE: swap unit statuses if serial changed
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.serial_number IS DISTINCT FROM NEW.serial_number) THEN
      -- Make old unit available again
      IF OLD.serial_number IS NOT NULL AND OLD.serial_number <> '' THEN
        UPDATE public.product_units
        SET status = 'available', updated_at = now()
        WHERE product_id = OLD.product_id AND serial_number = OLD.serial_number;
      END IF;
      -- Mark new unit as sold
      IF NEW.serial_number IS NOT NULL AND NEW.serial_number <> '' THEN
        UPDATE public.product_units
        SET status = 'sold', updated_at = now()
        WHERE product_id = NEW.product_id AND serial_number = NEW.serial_number;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE: mark unit as available
  IF TG_OP = 'DELETE' THEN
    IF OLD.serial_number IS NOT NULL AND OLD.serial_number <> '' THEN
      UPDATE public.product_units
      SET status = 'available', updated_at = now()
      WHERE product_id = OLD.product_id AND serial_number = OLD.serial_number;
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2) Attach triggers for stock updates (using existing function) and unit status updates
-- Drop existing triggers if they exist to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_stock_ai') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_stock_ai ON public.sale_items';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_stock_au') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_stock_au ON public.sale_items';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_stock_ad') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_stock_ad ON public.sale_items';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_unit_ai') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_unit_ai ON public.sale_items';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_unit_au') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_unit_au ON public.sale_items';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sale_items_unit_ad') THEN
    EXECUTE 'DROP TRIGGER trg_sale_items_unit_ad ON public.sale_items';
  END IF;
END $$;

-- Re-create triggers
CREATE TRIGGER trg_sale_items_stock_ai
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

CREATE TRIGGER trg_sale_items_stock_au
AFTER UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

CREATE TRIGGER trg_sale_items_stock_ad
AFTER DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

CREATE TRIGGER trg_sale_items_unit_ai
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();

CREATE TRIGGER trg_sale_items_unit_au
AFTER UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();

CREATE TRIGGER trg_sale_items_unit_ad
AFTER DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();

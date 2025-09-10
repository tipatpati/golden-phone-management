-- CRITICAL SYNCHRONIZATION FIX: Remove redundant triggers and establish single source of truth

-- Remove ALL redundant stock update triggers to prevent conflicts
DROP TRIGGER IF EXISTS update_product_stock_on_sale_trg ON public.sale_items;
DROP TRIGGER IF EXISTS product_units_sync_stock_trg ON public.product_units;
DROP TRIGGER IF EXISTS update_product_unit_status_on_sale_trg ON public.sale_items;

-- Ensure the essential stock sync trigger exists and is the ONLY one
CREATE OR REPLACE FUNCTION public.sync_product_stock_from_units()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_product_id uuid;
  v_has_serial boolean;
  v_available_count integer;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  IF v_product_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only adjust stock for serialized products
  SELECT has_serial INTO v_has_serial
  FROM public.products
  WHERE id = v_product_id;

  IF v_has_serial THEN
    SELECT COUNT(*) INTO v_available_count
    FROM public.product_units
    WHERE product_id = v_product_id
      AND status = 'available';

    UPDATE public.products
    SET stock = v_available_count,
        updated_at = now()
    WHERE id = v_product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Ensure we have the ONE essential trigger for stock sync
DROP TRIGGER IF EXISTS sync_product_stock_trg ON public.product_units;
CREATE TRIGGER sync_product_stock_trg
    AFTER INSERT OR UPDATE OR DELETE ON public.product_units
    FOR EACH ROW
    EXECUTE FUNCTION sync_product_stock_from_units();

-- Create a simplified trigger for sale items that ONLY updates unit status (not stock)
CREATE OR REPLACE FUNCTION public.update_unit_status_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Handle DELETE: restore unit to available when sale item is deleted
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
$function$;

-- Create the sale items trigger (ONLY for unit status, stock is handled by the product_units trigger)
DROP TRIGGER IF EXISTS update_unit_status_on_sale_trg ON public.sale_items;
CREATE TRIGGER update_unit_status_on_sale_trg
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_unit_status_on_sale();
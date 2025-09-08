-- Ensure inventory restoration triggers are working properly for sale deletions

-- Check if the trigger exists and fix it if needed
CREATE OR REPLACE FUNCTION public.update_product_stock_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  product_has_serial boolean;
BEGIN
  -- Get whether this product uses serial numbers
  SELECT has_serial INTO product_has_serial
  FROM products 
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  -- Handle INSERT: decrease stock when sale item is created
  IF TG_OP = 'INSERT' THEN
    -- For serialized products, don't touch stock count (handled by product_units status)
    IF NOT product_has_serial THEN
      UPDATE products 
      SET stock = stock - NEW.quantity
      WHERE id = NEW.product_id;
      
      -- Check if stock goes negative
      IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
          NEW.product_id, 
          (SELECT stock + NEW.quantity FROM products WHERE id = NEW.product_id),
          NEW.quantity;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE: adjust stock for quantity changes
  IF TG_OP = 'UPDATE' THEN
    -- For non-serialized products only
    IF NOT product_has_serial THEN
      -- Restore old quantity and subtract new quantity
      UPDATE products 
      SET stock = stock + OLD.quantity - NEW.quantity
      WHERE id = NEW.product_id;
      
      -- Check if stock goes negative
      IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
          NEW.product_id, 
          (SELECT stock + NEW.quantity - OLD.quantity FROM products WHERE id = NEW.product_id),
          NEW.quantity;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE: restore stock when sale item is deleted/cancelled
  IF TG_OP = 'DELETE' THEN
    -- For non-serialized products, restore stock
    IF NOT product_has_serial THEN
      UPDATE products 
      SET stock = stock + OLD.quantity
      WHERE id = OLD.product_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Ensure the trigger exists and restore inventory on product unit status change
CREATE OR REPLACE FUNCTION public.update_product_unit_status_on_sale()
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

-- Ensure triggers are properly set up
DROP TRIGGER IF EXISTS update_product_stock_on_sale_trigger ON sale_items;
CREATE TRIGGER update_product_stock_on_sale_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_sale();

DROP TRIGGER IF EXISTS update_product_unit_status_on_sale_trigger ON sale_items;
CREATE TRIGGER update_product_unit_status_on_sale_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_product_unit_status_on_sale();
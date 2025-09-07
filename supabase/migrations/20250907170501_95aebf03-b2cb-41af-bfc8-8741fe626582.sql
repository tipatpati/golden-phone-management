-- Phase A: Database Cleanup - Fix Stock Miscalculation Issues

-- First, let's see what triggers exist on sale_items table
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    prosrc as function_body
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'sale_items'::regclass
AND NOT tgisinternal;

-- Drop any duplicate/old triggers on sale_items (keeping only the main one)
DROP TRIGGER IF EXISTS sale_items_stock_trigger ON sale_items;
DROP TRIGGER IF EXISTS trg_sale_items_stock_update ON sale_items;
DROP TRIGGER IF EXISTS sale_items_stock_on_insert ON sale_items;
DROP TRIGGER IF EXISTS sale_items_stock_on_update ON sale_items;
DROP TRIGGER IF EXISTS sale_items_stock_on_delete ON sale_items;

-- Keep only the main trigger but recreate it to ensure consistency
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON sale_items;

-- Create improved stock update function that handles serialized vs non-serialized properly
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
    -- For non-serialized products only
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

-- Create the single, correct trigger
CREATE TRIGGER trigger_update_product_stock_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_sale();

-- Update the effective stock view to be more accurate
DROP VIEW IF EXISTS product_effective_stock;
CREATE VIEW product_effective_stock AS
SELECT 
  p.id as product_id,
  CASE 
    -- For serialized products: count available units
    WHEN p.has_serial = true THEN (
      SELECT COUNT(*)::bigint 
      FROM product_units pu 
      WHERE pu.product_id = p.id 
      AND pu.status = 'available'
    )
    -- For non-serialized products: use stock field
    ELSE p.stock::bigint
  END as effective_stock
FROM products p;
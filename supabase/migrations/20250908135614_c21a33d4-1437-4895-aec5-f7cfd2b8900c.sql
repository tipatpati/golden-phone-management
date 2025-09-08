-- 1) Ensure sync function exists (safe to re-create)
CREATE OR REPLACE FUNCTION public.sync_product_stock_from_units()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 2) Normalize product_units trigger to keep products.stock in sync for serialized items
DROP TRIGGER IF EXISTS product_units_sync_stock_trg ON public.product_units;
CREATE TRIGGER product_units_sync_stock_trg
AFTER INSERT OR UPDATE OR DELETE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_stock_from_units();

-- 3) Recreate sale_items triggers to ensure robust stock + unit status handling
-- Drop old triggers if present (names used by previous attempts might differ; we drop ours safely)
DROP TRIGGER IF EXISTS sale_items_adjust_product_stock_trg ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_update_unit_status_trg ON public.sale_items;
DROP TRIGGER IF EXISTS sale_items_create_sold_unit_trg ON public.sale_items;

-- Adjust stock for non-serialized products on INSERT/UPDATE/DELETE
CREATE TRIGGER sale_items_adjust_product_stock_trg
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_on_sale();

-- Update product_units status for serialized products (available/sold) on INSERT/UPDATE/DELETE
CREATE TRIGGER sale_items_update_unit_status_trg
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_product_unit_status_on_sale();

-- Maintain sold_product_units mirror table for traceability on INSERT/UPDATE/DELETE
CREATE TRIGGER sale_items_create_sold_unit_trg
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.create_sold_product_unit_from_sale_item();

-- 4) One-time backfill: ensure serialized products' stock reflects available units
-- First, set stock = available_count for products that have available units
UPDATE public.products p
SET stock = COALESCE(u.available_count, 0),
    updated_at = now()
FROM (
  SELECT product_id, COUNT(*) AS available_count
  FROM public.product_units
  WHERE status = 'available'
  GROUP BY product_id
) u
WHERE p.id = u.product_id
  AND p.has_serial = true;

-- Then, explicitly set stock = 0 for serialized products with no available units
UPDATE public.products p
SET stock = 0,
    updated_at = now()
WHERE p.has_serial = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_units u
    WHERE u.product_id = p.id AND u.status = 'available'
  );
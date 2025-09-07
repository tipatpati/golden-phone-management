-- Fix security issues and complete stock calculation improvements

-- Fix SECURITY DEFINER issue for the view by removing it and using proper permissions
DROP VIEW IF EXISTS product_effective_stock;

-- Add search_path to trigger functions that were missing it
CREATE OR REPLACE FUNCTION public.create_sold_product_unit_from_sale_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Fix the unit status trigger function
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
$function$;

-- Create a function for effective stock calculation instead of view
CREATE OR REPLACE FUNCTION public.get_product_effective_stock(product_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result bigint;
  product_has_serial boolean;
BEGIN
  SELECT has_serial INTO product_has_serial
  FROM products 
  WHERE id = product_uuid;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  IF product_has_serial THEN
    SELECT COUNT(*)::bigint INTO result
    FROM product_units 
    WHERE product_id = product_uuid 
    AND status = 'available';
  ELSE
    SELECT stock::bigint INTO result
    FROM products 
    WHERE id = product_uuid;
  END IF;
  
  RETURN COALESCE(result, 0);
END;
$function$;
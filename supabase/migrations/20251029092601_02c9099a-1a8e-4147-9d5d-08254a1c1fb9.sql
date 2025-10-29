-- Fix create_sold_product_unit_from_sale_item trigger to include store_id
CREATE OR REPLACE FUNCTION public.create_sold_product_unit_from_sale_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_unit_id uuid;
  v_barcode text;
  v_sale_number text;
  v_payment_method text;
  v_client_id uuid;
  v_salesperson_id uuid;
  v_customer_name text;
  v_salesperson_name text;
  v_supplier_id uuid;
  v_supplier_name text;
  v_purchase_price numeric;
  v_store_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
      -- Get unit data
      SELECT id, barcode, supplier_id, purchase_price 
      INTO v_unit_id, v_barcode, v_supplier_id, v_purchase_price
      FROM public.product_units
      WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
      LIMIT 1;

      IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
      END IF;

      -- Get sale data including store_id
      SELECT s.sale_number, s.payment_method, s.client_id, s.salesperson_id, s.store_id 
      INTO v_sale_number, v_payment_method, v_client_id, v_salesperson_id, v_store_id
      FROM public.sales s
      WHERE s.id = NEW.sale_id
      LIMIT 1;

      -- Get client data if client exists
      IF v_client_id IS NOT NULL THEN
        SELECT 
          CASE 
            WHEN c.type = 'individual' THEN COALESCE(c.first_name || ' ' || c.last_name, c.first_name, c.last_name)
            ELSE COALESCE(c.company_name, c.contact_person)
          END
        INTO v_customer_name
        FROM public.clients c
        WHERE c.id = v_client_id
        LIMIT 1;
      END IF;

      -- Get salesperson data
      SELECT p.username INTO v_salesperson_name
      FROM public.profiles p
      WHERE p.id = v_salesperson_id
      LIMIT 1;

      -- Get supplier name if supplier_id exists
      IF v_supplier_id IS NOT NULL THEN
        SELECT s.name INTO v_supplier_name
        FROM public.suppliers s
        WHERE s.id = v_supplier_id
        LIMIT 1;
      END IF;

      INSERT INTO public.sold_product_units (
        sale_id, sale_item_id, product_id, product_unit_id, serial_number, barcode, 
        sold_price, sold_at, sale_number, customer_name, payment_method, 
        salesperson_name, original_purchase_price, supplier_name, store_id
      ) VALUES (
        NEW.sale_id, NEW.id, NEW.product_id, v_unit_id, btrim(NEW.serial_number), v_barcode, 
        NEW.unit_price, now(), v_sale_number, v_customer_name, 
        v_payment_method, v_salesperson_name, 
        v_purchase_price, v_supplier_name, v_store_id
      )
      ON CONFLICT (sale_item_id) DO UPDATE SET
        product_id = EXCLUDED.product_id,
        product_unit_id = EXCLUDED.product_unit_id,
        serial_number = EXCLUDED.serial_number,
        barcode = EXCLUDED.barcode,
        sold_price = EXCLUDED.sold_price,
        sale_number = EXCLUDED.sale_number,
        customer_name = EXCLUDED.customer_name,
        payment_method = EXCLUDED.payment_method,
        salesperson_name = EXCLUDED.salesperson_name,
        original_purchase_price = EXCLUDED.original_purchase_price,
        supplier_name = EXCLUDED.supplier_name,
        store_id = EXCLUDED.store_id,
        updated_at = now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.serial_number IS DISTINCT FROM NEW.serial_number) OR (OLD.unit_price IS DISTINCT FROM NEW.unit_price) THEN
      IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
        SELECT id, barcode, supplier_id, purchase_price 
        INTO v_unit_id, v_barcode, v_supplier_id, v_purchase_price
        FROM public.product_units
        WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
        LIMIT 1;

        IF v_unit_id IS NULL THEN
          RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
        END IF;

        IF v_supplier_id IS NOT NULL THEN
          SELECT s.name INTO v_supplier_name
          FROM public.suppliers s
          WHERE s.id = v_supplier_id
          LIMIT 1;
        END IF;

        UPDATE public.sold_product_units SET
          product_unit_id = v_unit_id,
          serial_number = btrim(NEW.serial_number),
          barcode = v_barcode,
          sold_price = NEW.unit_price,
          original_purchase_price = v_purchase_price,
          supplier_name = v_supplier_name,
          updated_at = now()
        WHERE sale_item_id = NEW.id;
      ELSE
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
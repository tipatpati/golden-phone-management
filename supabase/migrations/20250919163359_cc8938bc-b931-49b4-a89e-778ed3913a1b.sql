-- Fix the create_sold_product_unit_from_sale_item trigger function
-- The issue is with unassigned variable v_supplier_data

CREATE OR REPLACE FUNCTION public.create_sold_product_unit_from_sale_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_unit_id uuid;
  v_barcode text;
  v_sale_data record;
  v_client_data record;
  v_supplier_name text;
  v_purchase_price numeric;
  v_salesperson_data record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
      -- Get unit data
      SELECT id, barcode, supplier_id, purchase_price 
      INTO v_unit_id, v_barcode, v_supplier_name, v_purchase_price
      FROM public.product_units
      WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
      LIMIT 1;

      IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
      END IF;

      -- Get sale data
      SELECT s.sale_number, s.payment_method, s.client_id, s.salesperson_id INTO v_sale_data
      FROM public.sales s
      WHERE s.id = NEW.sale_id
      LIMIT 1;

      -- Get client data
      IF v_sale_data.client_id IS NOT NULL THEN
        SELECT 
          CASE 
            WHEN c.type = 'individual' THEN COALESCE(c.first_name || ' ' || c.last_name, c.first_name, c.last_name)
            ELSE COALESCE(c.company_name, c.contact_person)
          END as customer_name
        INTO v_client_data
        FROM public.clients c
        WHERE c.id = v_sale_data.client_id
        LIMIT 1;
      END IF;

      -- Get salesperson data
      SELECT p.username INTO v_salesperson_data
      FROM public.profiles p
      WHERE p.id = v_sale_data.salesperson_id
      LIMIT 1;

      -- Get supplier name if supplier_id exists
      IF v_supplier_name IS NOT NULL THEN
        SELECT s.name INTO v_supplier_name
        FROM public.suppliers s
        WHERE s.id = v_supplier_name::uuid
        LIMIT 1;
      END IF;

      INSERT INTO public.sold_product_units (
        sale_id, sale_item_id, product_id, product_unit_id, serial_number, barcode, 
        sold_price, sold_at, sale_number, customer_name, payment_method, 
        salesperson_name, original_purchase_price, supplier_name
      ) VALUES (
        NEW.sale_id, NEW.id, NEW.product_id, v_unit_id, btrim(NEW.serial_number), v_barcode, 
        NEW.unit_price, now(), v_sale_data.sale_number, v_client_data.customer_name, 
        v_sale_data.payment_method, v_salesperson_data.username, 
        v_purchase_price, v_supplier_name
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
        updated_at = now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle updates similar to above but with update logic
    IF (OLD.serial_number IS DISTINCT FROM NEW.serial_number) OR (OLD.unit_price IS DISTINCT FROM NEW.unit_price) THEN
      -- Update logic similar to insert
      IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
        -- Get updated data and update sold_product_units record
        SELECT id, barcode, supplier_id, purchase_price 
        INTO v_unit_id, v_barcode, v_supplier_name, v_purchase_price
        FROM public.product_units
        WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
        LIMIT 1;

        IF v_unit_id IS NULL THEN
          RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
        END IF;

        -- Get supplier name if supplier_id exists
        IF v_supplier_name IS NOT NULL THEN
          SELECT s.name INTO v_supplier_name
          FROM public.suppliers s
          WHERE s.id = v_supplier_name::uuid
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

-- Also fix the get_current_user_role function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'salesperson'::app_role
  )
$function$;
-- Enhance sold_product_units table with additional tracking fields
ALTER TABLE public.sold_product_units 
ADD COLUMN IF NOT EXISTS sale_number text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS salesperson_name text,
ADD COLUMN IF NOT EXISTS original_purchase_price numeric,
ADD COLUMN IF NOT EXISTS supplier_name text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sold_product_units_sale_number ON public.sold_product_units(sale_number);
CREATE INDEX IF NOT EXISTS idx_sold_product_units_customer_name ON public.sold_product_units(customer_name);

-- Update the trigger to populate additional fields from sale data
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
  v_supplier_data record;
  v_salesperson_data record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.serial_number IS NOT NULL AND btrim(NEW.serial_number) <> '' THEN
      -- Get unit data
      SELECT id, barcode, supplier_id, purchase_price INTO v_unit_id, v_barcode, v_supplier_data.supplier_id, v_supplier_data.purchase_price
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

      -- Get supplier data
      IF v_supplier_data.supplier_id IS NOT NULL THEN
        SELECT s.name INTO v_supplier_data.supplier_name
        FROM public.suppliers s
        WHERE s.id = v_supplier_data.supplier_id
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
        v_supplier_data.purchase_price, v_supplier_data.supplier_name
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
        SELECT id, barcode, supplier_id, purchase_price INTO v_unit_id, v_barcode, v_supplier_data.supplier_id, v_supplier_data.purchase_price
        FROM public.product_units
        WHERE product_id = NEW.product_id AND btrim(serial_number) = btrim(NEW.serial_number)
        LIMIT 1;

        IF v_unit_id IS NULL THEN
          RAISE EXCEPTION 'Product unit not found for product % and serial %', NEW.product_id, NEW.serial_number;
        END IF;

        UPDATE public.sold_product_units SET
          product_unit_id = v_unit_id,
          serial_number = btrim(NEW.serial_number),
          barcode = v_barcode,
          sold_price = NEW.unit_price,
          original_purchase_price = v_supplier_data.purchase_price,
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

-- Create function to log sales in product history
CREATE OR REPLACE FUNCTION public.log_product_sale_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sale_data record;
  v_client_data record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get sale and client data for history
    SELECT s.sale_number, s.payment_method, s.total_amount, c.first_name, c.last_name, c.company_name, c.type
    INTO v_sale_data
    FROM public.sales s
    LEFT JOIN public.clients c ON c.id = s.client_id
    WHERE s.id = NEW.sale_id
    LIMIT 1;

    -- Log the sale in product history
    INSERT INTO public.product_history (
      product_id, operation_type, changed_by, old_data, new_data, note
    ) VALUES (
      NEW.product_id, 
      'sold', 
      auth.uid(),
      NULL,
      jsonb_build_object(
        'sale_id', NEW.sale_id,
        'sale_number', v_sale_data.sale_number,
        'serial_number', NEW.serial_number,
        'sold_price', NEW.sold_price,
        'customer_name', NEW.customer_name,
        'payment_method', v_sale_data.payment_method,
        'sold_at', NEW.sold_at
      ),
      'Product unit sold - Sale #' || COALESCE(v_sale_data.sale_number, NEW.sale_id::text)
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log sale cancellation/return
    INSERT INTO public.product_history (
      product_id, operation_type, changed_by, old_data, new_data, note
    ) VALUES (
      OLD.product_id, 
      'sale_cancelled', 
      auth.uid(),
      jsonb_build_object(
        'sale_id', OLD.sale_id,
        'sale_number', OLD.sale_number,
        'serial_number', OLD.serial_number,
        'sold_price', OLD.sold_price,
        'customer_name', OLD.customer_name
      ),
      NULL,
      'Sale cancelled/returned - Sale #' || COALESCE(OLD.sale_number, OLD.sale_id::text)
    );

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for logging sales in product history
DROP TRIGGER IF EXISTS log_sold_products_history ON public.sold_product_units;
CREATE TRIGGER log_sold_products_history
  AFTER INSERT OR DELETE ON public.sold_product_units
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_sale_history();
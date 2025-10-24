-- Fix search_path warnings by updating functions without search_path set

-- Update brands_set_derived_fields function
CREATE OR REPLACE FUNCTION public.brands_set_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.slug := slugify(coalesce(NEW.name, ''));
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.name, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Update models_set_derived_fields function  
CREATE OR REPLACE FUNCTION public.models_set_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  brand_name text;
BEGIN
  SELECT name INTO brand_name FROM public.brands WHERE id = NEW.brand_id;
  NEW.slug := slugify(coalesce(NEW.name, ''));
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.name, '') || ' ' || coalesce(brand_name, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Update slugify function
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result text;
BEGIN
  result := lower(coalesce(input, ''));
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := regexp_replace(result, '(^-|-$)', '', 'g');
  RETURN result;
END;
$function$;

-- Update validate_unit_pricing function
CREATE OR REPLACE FUNCTION public.validate_unit_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.price IS NOT NULL THEN
    IF NEW.min_price IS NOT NULL AND NEW.min_price <= NEW.price THEN
      RAISE EXCEPTION 'Unit minimum selling price must be greater than base price for serial %', NEW.serial_number;
    END IF;
    IF NEW.max_price IS NOT NULL AND NEW.max_price <= NEW.price THEN
      RAISE EXCEPTION 'Unit maximum selling price must be greater than base price for serial %', NEW.serial_number;
    END IF;
  END IF;
  IF NEW.min_price IS NOT NULL AND NEW.max_price IS NOT NULL AND NEW.min_price >= NEW.max_price THEN
    RAISE EXCEPTION 'Unit minimum price must be less than maximum price for serial %', NEW.serial_number;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update handle_sale_return_inventory function
CREATE OR REPLACE FUNCTION public.handle_sale_return_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item RECORD;
  is_serial BOOLEAN;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    FOR item IN 
      SELECT * FROM sale_return_items WHERE return_id = NEW.id
    LOOP
      SELECT has_serial INTO is_serial FROM products WHERE id = item.product_id;
      
      IF is_serial AND item.serial_number IS NOT NULL THEN
        UPDATE product_units
        SET status = CASE 
          WHEN item.return_condition IN ('damaged', 'defective') THEN 'damaged'
          ELSE 'available'
        END,
        condition = item.return_condition
        WHERE serial_number = item.serial_number
        AND product_id = item.product_id;
        
        DELETE FROM sold_product_units
        WHERE serial_number = item.serial_number;
      ELSE
        UPDATE products
        SET stock = stock + item.quantity
        WHERE id = item.product_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update generate_return_number function
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_num INTEGER;
  return_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM sale_returns
  WHERE return_number ~ '^RET-[0-9]+$';
  
  return_num := 'RET-' || LPAD(next_num::TEXT, 6, '0');
  RETURN return_num;
END;
$function$;
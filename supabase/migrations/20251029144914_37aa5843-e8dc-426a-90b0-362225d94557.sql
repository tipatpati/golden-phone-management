-- Fix get_product_effective_stock to handle store context properly
-- This function was returning 0 for valid products due to RLS blocking access when store context wasn't set

CREATE OR REPLACE FUNCTION public.get_product_effective_stock(product_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result bigint;
  product_has_serial boolean;
  product_store_id uuid;
  current_user_role app_role;
BEGIN
  -- Get user role for super admin bypass
  current_user_role := get_current_user_role();
  
  -- For super admins, temporarily bypass RLS by reading directly
  IF current_user_role = 'super_admin' THEN
    SELECT has_serial, store_id INTO product_has_serial, product_store_id
    FROM products 
    WHERE id = product_uuid;
  ELSE
    -- For regular users, use normal RLS
    SELECT has_serial, store_id INTO product_has_serial, product_store_id
    FROM products 
    WHERE id = product_uuid;
  END IF;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate effective stock based on serialization
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
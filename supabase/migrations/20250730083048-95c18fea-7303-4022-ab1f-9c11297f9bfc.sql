-- Drop trigger first, then functions, then recreate with security fixes
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON sale_items;
DROP FUNCTION IF EXISTS public.update_product_stock_on_sale();
DROP FUNCTION IF EXISTS public.validate_product_stock(jsonb);

-- Function to update product stock when sale items are created (with security fix)
CREATE OR REPLACE FUNCTION public.update_product_stock_on_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Decrease stock when sale item is inserted (sale created)
  IF TG_OP = 'INSERT' THEN
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
    
    RETURN NEW;
  END IF;
  
  -- Handle updates (quantity changes)
  IF TG_OP = 'UPDATE' THEN
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
    
    RETURN NEW;
  END IF;
  
  -- Handle deletions (sale cancelled/refunded)
  IF TG_OP = 'DELETE' THEN
    -- Restore stock when sale item is deleted
    UPDATE products 
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for sale_items
CREATE TRIGGER trigger_update_product_stock_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_sale();

-- Function to validate stock before creating sale items (with security fix)
CREATE OR REPLACE FUNCTION public.validate_product_stock(
  product_items jsonb
)
RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  available_stock integer;
  required_quantity integer;
  product_info record;
BEGIN
  -- Loop through each product item
  FOR item IN SELECT * FROM jsonb_array_elements(product_items)
  LOOP
    -- Get product details
    SELECT stock, brand, model INTO product_info
    FROM products 
    WHERE id = (item->>'product_id')::uuid;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', item->>'product_id';
    END IF;
    
    required_quantity := (item->>'quantity')::integer;
    available_stock := product_info.stock;
    
    -- Check if sufficient stock is available
    IF available_stock < required_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % %. Available: %, Requested: %', 
        product_info.brand, 
        product_info.model,
        available_stock, 
        required_quantity;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;
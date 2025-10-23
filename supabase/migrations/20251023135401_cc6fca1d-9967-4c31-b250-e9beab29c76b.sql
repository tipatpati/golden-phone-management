-- Create sale_returns table
CREATE TABLE public.sale_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number TEXT UNIQUE NOT NULL,
  sale_id UUID NOT NULL REFERENCES sales(id),
  returned_by UUID REFERENCES profiles(id),
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  return_reason TEXT NOT NULL,
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  restocking_fee NUMERIC NOT NULL DEFAULT 0,
  refund_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_return_items table
CREATE TABLE public.sale_return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  serial_number TEXT,
  return_condition TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  refund_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sale_returns
CREATE POLICY "Admins and managers can view all returns"
ON public.sale_returns FOR SELECT
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Salespersons can view own returns"
ON public.sale_returns FOR SELECT
USING (
  get_current_user_role() = 'salesperson'::app_role 
  AND returned_by = auth.uid()
);

CREATE POLICY "Authorized users can create returns"
ON public.sale_returns FOR INSERT
WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

CREATE POLICY "Admins and managers can update returns"
ON public.sale_returns FOR UPDATE
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins can delete returns"
ON public.sale_returns FOR DELETE
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

-- RLS Policies for sale_return_items
CREATE POLICY "Users can view return items if they can view the return"
ON public.sale_return_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sale_returns sr
    WHERE sr.id = sale_return_items.return_id
    AND (
      get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role])
      OR (get_current_user_role() = 'salesperson'::app_role AND sr.returned_by = auth.uid())
    )
  )
);

CREATE POLICY "System can insert return items"
ON public.sale_return_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage return items"
ON public.sale_return_items FOR ALL
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on return completion
CREATE OR REPLACE FUNCTION handle_sale_return_inventory()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER sale_return_inventory_trigger
AFTER INSERT OR UPDATE ON sale_returns
FOR EACH ROW
EXECUTE FUNCTION handle_sale_return_inventory();

-- Trigger for updated_at
CREATE TRIGGER update_sale_returns_updated_at
BEFORE UPDATE ON sale_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
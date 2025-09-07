-- Create sold_product_units table to track sold units for returns/exchanges
CREATE TABLE public.sold_product_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  sale_item_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_unit_id UUID NOT NULL,
  serial_number TEXT NOT NULL,
  barcode TEXT,
  sold_price NUMERIC NOT NULL,
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sold_product_units ENABLE ROW LEVEL SECURITY;

-- Create policies for sold_product_units
CREATE POLICY "Authorized users can view sold units" 
ON public.sold_product_units 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'salesperson'::app_role]));

CREATE POLICY "System can insert sold units" 
ON public.sold_product_units 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage sold units" 
ON public.sold_product_units 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role]));

-- Add indexes for performance
CREATE INDEX idx_sold_product_units_sale_id ON public.sold_product_units(sale_id);
CREATE INDEX idx_sold_product_units_serial ON public.sold_product_units(serial_number);
CREATE INDEX idx_sold_product_units_product_id ON public.sold_product_units(product_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sold_product_units_updated_at
BEFORE UPDATE ON public.sold_product_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
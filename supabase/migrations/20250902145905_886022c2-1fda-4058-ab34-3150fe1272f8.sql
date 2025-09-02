-- Create product_units table for individual unit tracking with IMEI barcodes
CREATE TABLE public.product_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  barcode TEXT,
  color TEXT,
  battery_level INTEGER,
  status TEXT NOT NULL DEFAULT 'available', -- available, sold, reserved, damaged
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, serial_number)
);

-- Enable Row Level Security
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Authorized users can view product units" 
ON public.product_units 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

CREATE POLICY "Inventory managers can manage product units" 
ON public.product_units 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_units_updated_at
BEFORE UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_product_units_product_id ON public.product_units(product_id);
CREATE INDEX idx_product_units_serial_number ON public.product_units(serial_number);
CREATE INDEX idx_product_units_barcode ON public.product_units(barcode);
CREATE INDEX idx_product_units_status ON public.product_units(status);
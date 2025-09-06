-- Create barcode registry table for centralized barcode management
CREATE TABLE public.barcode_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  barcode_type TEXT NOT NULL CHECK (barcode_type IN ('unit', 'product')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'product_unit')),
  entity_id UUID NOT NULL,
  format TEXT NOT NULL DEFAULT 'CODE128',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_barcode_registry_barcode ON public.barcode_registry(barcode);
CREATE INDEX idx_barcode_registry_entity ON public.barcode_registry(entity_type, entity_id);
CREATE INDEX idx_barcode_registry_type ON public.barcode_registry(barcode_type);

-- Enable RLS
ALTER TABLE public.barcode_registry ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authorized users can view barcodes" 
ON public.barcode_registry 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

CREATE POLICY "Inventory managers can manage barcodes" 
ON public.barcode_registry 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Create company settings table for barcode configuration
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage company settings" 
ON public.company_settings 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]));

CREATE POLICY "Users can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role, 'salesperson'::app_role, 'technician'::app_role]));

-- Insert initial barcode configuration
INSERT INTO public.company_settings (setting_key, setting_value) VALUES 
('barcode_config', '{
  "prefix": "GPMS",
  "format": "CODE128", 
  "counters": {
    "unit": 1000,
    "product": 1000
  }
}');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_barcode_registry_updated_at
    BEFORE UPDATE ON public.barcode_registry
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
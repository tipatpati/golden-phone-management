
-- Create clients table for B2B and B2C management
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('individual', 'business')),
  first_name text,
  last_name text,
  company_name text,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure required fields based on type
  CONSTRAINT check_individual_fields CHECK (
    (type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (type = 'business' AND company_name IS NOT NULL)
  )
);

-- Create sales table
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id),
  salesperson_id uuid REFERENCES public.profiles(id) NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled', 'refunded')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'other')),
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  sale_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sale_items table for individual products in each sale
CREATE TABLE public.sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  serial_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create updated_at triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all clients" 
  ON public.clients 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update clients" 
  ON public.clients 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete clients" 
  ON public.clients 
  FOR DELETE 
  USING (true);

-- Add RLS policies for sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sales" 
  ON public.sales 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create sales" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update sales" 
  ON public.sales 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete sales" 
  ON public.sales 
  FOR DELETE 
  USING (true);

-- Add RLS policies for sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all sale items" 
  ON public.sale_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create sale items" 
  ON public.sale_items 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update sale items" 
  ON public.sale_items 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete sale items" 
  ON public.sale_items 
  FOR DELETE 
  USING (true);

-- Create function to generate sale numbers
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  sale_number text;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM public.sales
  WHERE sale_number LIKE 'SAL-%';
  
  -- Format as SAL-XXX with zero padding
  sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
  
  RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate sale numbers
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
    NEW.sale_number := generate_sale_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_sale_number
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION set_sale_number();


-- Create repairs table for managing device repairs
CREATE TABLE public.repairs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_number text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id),
  technician_id uuid REFERENCES public.profiles(id),
  device text NOT NULL,
  imei text,
  issue text NOT NULL,
  status text NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'in_progress', 'awaiting_parts', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  cost numeric NOT NULL DEFAULT 0,
  parts_cost numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  estimated_completion_date timestamp with time zone,
  actual_completion_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create repair_parts table for tracking parts used in repairs
CREATE TABLE public.repair_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_id uuid REFERENCES public.repairs(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create updated_at trigger for repairs
CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies for repairs
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all repairs" 
  ON public.repairs 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create repairs" 
  ON public.repairs 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update repairs" 
  ON public.repairs 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete repairs" 
  ON public.repairs 
  FOR DELETE 
  USING (true);

-- Add RLS policies for repair_parts
ALTER TABLE public.repair_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all repair parts" 
  ON public.repair_parts 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create repair parts" 
  ON public.repair_parts 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update repair parts" 
  ON public.repair_parts 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete repair parts" 
  ON public.repair_parts 
  FOR DELETE 
  USING (true);

-- Create function to generate repair numbers
CREATE OR REPLACE FUNCTION generate_repair_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  repair_number text;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(public.repairs.repair_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM public.repairs
  WHERE public.repairs.repair_number LIKE 'RIP-%';
  
  -- Format as RIP-XXX with zero padding
  repair_number := 'RIP-' || LPAD(next_number::text, 3, '0');
  
  RETURN repair_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate repair numbers
CREATE OR REPLACE FUNCTION set_repair_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.repair_number IS NULL OR NEW.repair_number = '' THEN
    NEW.repair_number := generate_repair_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_repair_number
  BEFORE INSERT ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION set_repair_number();

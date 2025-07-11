-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  credit_limit NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_transactions table
CREATE TABLE public.supplier_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'payment', 'return')),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_transaction_items table
CREATE TABLE public.supplier_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.supplier_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transaction_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suppliers" ON public.suppliers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for supplier_transactions
CREATE POLICY "Authenticated users can view transactions" ON public.supplier_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create transactions" ON public.supplier_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update transactions" ON public.supplier_transactions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete transactions" ON public.supplier_transactions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for supplier_transaction_items
CREATE POLICY "Authenticated users can view transaction items" ON public.supplier_transaction_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create transaction items" ON public.supplier_transaction_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update transaction items" ON public.supplier_transaction_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete transaction items" ON public.supplier_transaction_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to generate transaction numbers
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
  transaction_number text;
BEGIN
  -- Get the next number in sequence
  SELECT COALESCE(MAX(CAST(SUBSTRING(public.supplier_transactions.transaction_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM public.supplier_transactions
  WHERE public.supplier_transactions.transaction_number LIKE 'TXN-%';
  
  -- Format as TXN-XXX with zero padding
  transaction_number := 'TXN-' || LPAD(next_number::text, 3, '0');
  
  RETURN transaction_number;
END;
$$;

-- Create trigger to set transaction number
CREATE OR REPLACE FUNCTION public.set_transaction_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := generate_transaction_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_supplier_transaction_number
  BEFORE INSERT ON public.supplier_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_transaction_number();

-- Create triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_transactions_updated_at
  BEFORE UPDATE ON public.supplier_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
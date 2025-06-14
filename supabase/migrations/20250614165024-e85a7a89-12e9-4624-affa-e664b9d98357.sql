
-- Fix the ambiguous column reference in the generate_sale_number function
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  sale_number text;
BEGIN
  -- Get the next number in sequence - explicitly qualify the column name
  SELECT COALESCE(MAX(CAST(SUBSTRING(public.sales.sale_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM public.sales
  WHERE public.sales.sale_number LIKE 'SAL-%';
  
  -- Format as SAL-XXX with zero padding
  sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
  
  RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Create a sequence for sale numbers to handle concurrency
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;

-- Create a more robust sale number generation function
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    next_number integer;
    sale_number text;
    max_existing_number integer;
BEGIN
    -- Get the highest existing sale number
    SELECT COALESCE(MAX(CAST(SUBSTRING(sales.sale_number FROM 5) AS integer)), 0)
    INTO max_existing_number
    FROM sales
    WHERE sales.sale_number LIKE 'SAL-%' AND LENGTH(SUBSTRING(sales.sale_number FROM 5)) <= 6;
    
    -- Set sequence to be at least as high as existing numbers
    PERFORM setval('sale_number_seq', GREATEST(max_existing_number, currval('sale_number_seq')), true);
    
    -- Get next number from sequence (this is atomic and handles concurrency)
    next_number := nextval('sale_number_seq');
    
    -- Generate the sale number
    sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
    
    -- Double-check for uniqueness and retry if needed
    WHILE EXISTS (SELECT 1 FROM sales WHERE sale_number = sale_number) LOOP
        next_number := nextval('sale_number_seq');
        sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
    END LOOP;
    
    RETURN sale_number;
END;
$function$;
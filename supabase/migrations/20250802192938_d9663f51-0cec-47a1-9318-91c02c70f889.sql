-- Create the missing sequence for sale numbers
CREATE SEQUENCE IF NOT EXISTS public.sale_number_seq START 1;

-- Update the generate_sale_number function to handle concurrency better
CREATE OR REPLACE FUNCTION public.generate_sale_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number integer;
    sale_number text;
    max_existing_number integer;
    retry_count integer := 0;
BEGIN
    -- Get the highest existing sale number
    SELECT COALESCE(MAX(CAST(SUBSTRING(sales.sale_number FROM 5) AS integer)), 0)
    INTO max_existing_number
    FROM sales
    WHERE sales.sale_number LIKE 'SAL-%' AND LENGTH(SUBSTRING(sales.sale_number FROM 5)) <= 6;
    
    -- Set sequence to be at least as high as existing numbers
    PERFORM setval('sale_number_seq', GREATEST(max_existing_number, COALESCE(currval('sale_number_seq'), 0)), true);
    
    -- Loop to handle race conditions
    LOOP
        -- Get next number from sequence (this is atomic and handles concurrency)
        next_number := nextval('sale_number_seq');
        
        -- Generate the sale number
        sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM sales WHERE sale_number = sale_number) THEN
            RETURN sale_number;
        END IF;
        
        -- Prevent infinite loops
        retry_count := retry_count + 1;
        IF retry_count > 100 THEN
            RAISE EXCEPTION 'Failed to generate unique sale number after 100 attempts';
        END IF;
    END LOOP;
END;
$function$;
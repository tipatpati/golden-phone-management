-- Update the generate_sale_number function to match the existing YYMMDDXXXX format
CREATE OR REPLACE FUNCTION public.generate_sale_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    next_number integer;
    sale_number text;
    date_prefix text;
    max_existing_sequence integer;
BEGIN
    -- Generate date prefix in YYMMDD format
    date_prefix := to_char(current_date, 'YYMMDD');
    
    -- Get the highest sequence number for today
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(sales.sale_number FROM LENGTH(date_prefix) + 1) AS integer)), 
        0
    ) INTO max_existing_sequence
    FROM sales
    WHERE sales.sale_number LIKE date_prefix || '%' 
    AND LENGTH(sales.sale_number) = LENGTH(date_prefix) + 4
    AND sales.sale_number ~ ('^' || date_prefix || '\d{4}$');
    
    -- Get next sequence number (atomic operation)
    next_number := max_existing_sequence + 1;
    
    -- Generate the sale number in YYMMDDXXXX format
    sale_number := date_prefix || LPAD(next_number::text, 4, '0');
    
    -- Double-check for uniqueness and retry if needed (handle edge cases)
    WHILE EXISTS (SELECT 1 FROM sales WHERE sale_number = sale_number) LOOP
        next_number := next_number + 1;
        sale_number := date_prefix || LPAD(next_number::text, 4, '0');
        
        -- Prevent infinite loops
        IF next_number > 9999 THEN
            RAISE EXCEPTION 'Maximum daily sales limit reached (9999)';
        END IF;
    END LOOP;
    
    RETURN sale_number;
END;
$function$;
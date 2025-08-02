-- Create a more robust sale number generation with advisory locks to prevent race conditions
CREATE OR REPLACE FUNCTION public.generate_sale_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    generated_sale_number text;
    date_prefix text;
    max_existing_sequence integer;
    next_number integer;
    lock_key bigint;
BEGIN
    -- Generate date prefix in YYMMDD format
    date_prefix := to_char(current_date, 'YYMMDD');
    
    -- Create a unique lock key based on the date (same day = same lock)
    lock_key := ('x' || substr(md5(date_prefix), 1, 15))::bit(60)::bigint;
    
    -- Acquire advisory lock to prevent concurrent execution for the same day
    PERFORM pg_advisory_lock(lock_key);
    
    BEGIN
        -- Get the highest sequence number for today (inside the lock)
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(sales.sale_number FROM LENGTH(date_prefix) + 1) AS integer)), 
            0
        ) INTO max_existing_sequence
        FROM sales
        WHERE sales.sale_number LIKE date_prefix || '%' 
        AND LENGTH(sales.sale_number) = LENGTH(date_prefix) + 4
        AND sales.sale_number ~ ('^' || date_prefix || '\d{4}$');
        
        -- Get next sequence number
        next_number := max_existing_sequence + 1;
        
        -- Generate the sale number in YYMMDDXXXX format
        generated_sale_number := date_prefix || LPAD(next_number::text, 4, '0');
        
        -- Prevent overflow
        IF next_number > 9999 THEN
            RAISE EXCEPTION 'Maximum daily sales limit reached (9999) for date %', date_prefix;
        END IF;
        
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(lock_key);
        
        RETURN generated_sale_number;
    EXCEPTION
        WHEN OTHERS THEN
            -- Always release the lock in case of error
            PERFORM pg_advisory_unlock(lock_key);
            RAISE;
    END;
END;
$function$;
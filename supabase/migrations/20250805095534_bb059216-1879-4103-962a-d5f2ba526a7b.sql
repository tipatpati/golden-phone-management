-- Fix function search path security issues by setting search_path explicitly

-- Update generate_sale_number function with security definer and search path
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_prefix TEXT;
    sequence_number INTEGER;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    -- Get today's date in YYMMDD format
    date_prefix := to_char(CURRENT_DATE, 'YYMMDD');
    
    WHILE attempt < max_attempts LOOP
        -- Get the next sequence number for today
        SELECT COALESCE(MAX(CAST(RIGHT(sale_number, 4) AS INTEGER)), 0) + 1
        INTO sequence_number
        FROM sales 
        WHERE sale_number LIKE date_prefix || '%'
        AND LENGTH(sale_number) = 10; -- Ensure we're only looking at properly formatted numbers
        
        -- Ensure sequence_number is at least 1
        IF sequence_number IS NULL OR sequence_number < 1 THEN
            sequence_number := 1;
        END IF;
        
        -- Format as 4-digit number
        new_number := date_prefix || LPAD(sequence_number::TEXT, 4, '0');
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM sales WHERE sale_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        attempt := attempt + 1;
    END LOOP;
    
    -- If we couldn't generate a unique number after max_attempts, use timestamp
    RETURN date_prefix || LPAD(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::INTEGER % 10000::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;

-- Update set_sale_number function with security definer and search path
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := generate_sale_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp;
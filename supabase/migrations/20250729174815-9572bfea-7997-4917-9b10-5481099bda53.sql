-- Fix database function security issues by setting search_path
-- This prevents SQL injection attacks by ensuring functions use the correct schema

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
BEGIN
    SELECT role INTO user_role
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'salesperson'::app_role);
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix generate_repair_number function
CREATE OR REPLACE FUNCTION generate_repair_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_number integer;
    repair_number text;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(repairs.repair_number FROM 5) AS integer)), 0) + 1
    INTO next_number
    FROM repairs
    WHERE repairs.repair_number LIKE 'RIP-%';
    
    repair_number := 'RIP-' || LPAD(next_number::text, 3, '0');
    
    RETURN repair_number;
END;
$$;

-- Fix generate_sale_number function
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_number integer;
    sale_number text;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(sales.sale_number FROM 5) AS integer)), 0) + 1
    INTO next_number
    FROM sales
    WHERE sales.sale_number LIKE 'SAL-%';
    
    sale_number := 'SAL-' || LPAD(next_number::text, 3, '0');
    
    RETURN sale_number;
END;
$$;

-- Fix generate_transaction_number function
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_number integer;
    transaction_number text;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_transactions.transaction_number FROM 5) AS integer)), 0) + 1
    INTO next_number
    FROM supplier_transactions
    WHERE supplier_transactions.transaction_number LIKE 'TXN-%';
    
    transaction_number := 'TXN-' || LPAD(next_number::text, 3, '0');
    
    RETURN transaction_number;
END;
$$;
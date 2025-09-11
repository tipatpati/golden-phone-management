-- Adjust RLS and add auto-numbering for supplier transactions to fix CRUD

-- 1) Create generator for supplier transaction numbers
CREATE OR REPLACE FUNCTION public.generate_supplier_transaction_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_number TEXT;
  date_prefix TEXT;
  sequence_number INTEGER;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  prefix TEXT := 'ST-';
BEGIN
  date_prefix := to_char(CURRENT_DATE, 'YYYYMMDD') || '-';

  WHILE attempt < max_attempts LOOP
    SELECT COALESCE(MAX(CAST(RIGHT(transaction_number, 4) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.supplier_transactions
    WHERE transaction_number LIKE prefix || date_prefix || '%'
      AND length(transaction_number) >= length(prefix || date_prefix) + 4;

    IF sequence_number IS NULL OR sequence_number < 1 THEN
      sequence_number := 1;
    END IF;

    new_number := prefix || date_prefix || LPAD(sequence_number::TEXT, 4, '0');

    IF NOT EXISTS (
      SELECT 1 FROM public.supplier_transactions WHERE transaction_number = new_number
    ) THEN
      RETURN new_number;
    END IF;

    attempt := attempt + 1;
  END LOOP;

  RETURN prefix || date_prefix || LPAD((extract(epoch from now())::int % 10000)::text, 4, '0');
END;
$$;

-- 2) Trigger to set transaction_number on insert
CREATE OR REPLACE FUNCTION public.set_supplier_transaction_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := public.generate_supplier_transaction_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure unique transaction numbers via unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_transactions_transaction_number_unique
  ON public.supplier_transactions (transaction_number);

-- Create triggers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_supplier_transaction_number_before_insert'
  ) THEN
    CREATE TRIGGER set_supplier_transaction_number_before_insert
    BEFORE INSERT ON public.supplier_transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_supplier_transaction_number();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_supplier_transactions_updated_at'
  ) THEN
    CREATE TRIGGER update_supplier_transactions_updated_at
    BEFORE UPDATE ON public.supplier_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Fix overly restrictive RLS on supplier_transactions
-- Drop existing super_admin-only policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_transactions' AND policyname = 'Super admins can view transactions') THEN
    DROP POLICY "Super admins can view transactions" ON public.supplier_transactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_transactions' AND policyname = 'Super admins can insert transactions') THEN
    DROP POLICY "Super admins can insert transactions" ON public.supplier_transactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_transactions' AND policyname = 'Super admins can update transactions') THEN
    DROP POLICY "Super admins can update transactions" ON public.supplier_transactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_transactions' AND policyname = 'Super admins can delete transactions') THEN
    DROP POLICY "Super admins can delete transactions" ON public.supplier_transactions;
  END IF;
END $$;

-- Create balanced policies aligned with suppliers module
CREATE POLICY "Authorized users can view supplier transactions"
ON public.supplier_transactions
FOR SELECT
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role])
);

CREATE POLICY "Inventory managers can insert supplier transactions"
ON public.supplier_transactions
FOR INSERT
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role])
);

CREATE POLICY "Inventory managers can update supplier transactions"
ON public.supplier_transactions
FOR UPDATE
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role])
)
WITH CHECK (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role])
);

CREATE POLICY "Admins can delete supplier transactions"
ON public.supplier_transactions
FOR DELETE
USING (
  get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role])
);

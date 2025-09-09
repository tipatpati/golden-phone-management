-- Wipe supplier-related data for a fresh start
BEGIN;
  -- Truncate child table first to satisfy FK dependencies
  TRUNCATE TABLE public.supplier_transaction_items RESTART IDENTITY;
  TRUNCATE TABLE public.supplier_transactions RESTART IDENTITY;
  TRUNCATE TABLE public.suppliers RESTART IDENTITY;
COMMIT;
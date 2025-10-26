-- =====================================================
-- MULTI-TENANT ARCHITECTURE - PHASE 2: ADD STORE_ID TO CORE TABLES
-- =====================================================
-- Adds store_id foreign key to all core business tables

-- =====================================================
-- 1. ADD STORE_ID TO SALES TABLES
-- =====================================================

-- Add store_id to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing sales
UPDATE public.sales
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required after migration
ALTER TABLE public.sales
ALTER COLUMN store_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sales_store_id ON public.sales(store_id);

-- Add store_id to sale_items (inherited from parent sale, but useful for queries)
ALTER TABLE public.sale_items
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent sale
UPDATE public.sale_items si
SET store_id = s.store_id
FROM public.sales s
WHERE si.sale_id = s.id AND si.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.sale_items
ALTER COLUMN store_id SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sale_items_store_id ON public.sale_items(store_id);

-- Add store_id to sale_returns
ALTER TABLE public.sale_returns
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent sale
UPDATE public.sale_returns sr
SET store_id = s.store_id
FROM public.sales s
WHERE sr.sale_id = s.id AND sr.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.sale_returns
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_sale_returns_store_id ON public.sale_returns(store_id);

-- Add store_id to sale_return_items
ALTER TABLE public.sale_return_items
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent return
UPDATE public.sale_return_items sri
SET store_id = sr.store_id
FROM public.sale_returns sr
WHERE sri.return_id = sr.id AND sri.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.sale_return_items
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_sale_return_items_store_id ON public.sale_return_items(store_id);

-- =====================================================
-- 2. ADD STORE_ID TO PRODUCTS/INVENTORY TABLES
-- =====================================================

-- Add store_id to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing products
UPDATE public.products
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.products
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- Add store_id to product_units
ALTER TABLE public.product_units
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent product
UPDATE public.product_units pu
SET store_id = p.store_id
FROM public.products p
WHERE pu.product_id = p.id AND pu.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.product_units
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_product_units_store_id ON public.product_units(store_id);

-- Add store_id to sold_product_units
ALTER TABLE public.sold_product_units
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent sale
UPDATE public.sold_product_units spu
SET store_id = s.store_id
FROM public.sales s
WHERE spu.sale_id = s.id AND spu.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.sold_product_units
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_sold_product_units_store_id ON public.sold_product_units(store_id);

-- =====================================================
-- 3. ADD STORE_ID TO CLIENTS TABLE
-- =====================================================

-- Add store_id to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing clients
UPDATE public.clients
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.clients
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_clients_store_id ON public.clients(store_id);

-- =====================================================
-- 4. ADD STORE_ID TO REPAIRS TABLES
-- =====================================================

-- Add store_id to repairs table
ALTER TABLE public.repairs
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing repairs
UPDATE public.repairs
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.repairs
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_repairs_store_id ON public.repairs(store_id);

-- Add store_id to repair_parts
ALTER TABLE public.repair_parts
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent repair
UPDATE public.repair_parts rp
SET store_id = r.store_id
FROM public.repairs r
WHERE rp.repair_id = r.id AND rp.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.repair_parts
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_repair_parts_store_id ON public.repair_parts(store_id);

-- =====================================================
-- 5. ADD STORE_ID TO SUPPLIERS TABLES
-- =====================================================

-- Add store_id to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing suppliers
UPDATE public.suppliers
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.suppliers
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_suppliers_store_id ON public.suppliers(store_id);

-- Add store_id to supplier_transactions
ALTER TABLE public.supplier_transactions
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent supplier
UPDATE public.supplier_transactions st
SET store_id = s.store_id
FROM public.suppliers s
WHERE st.supplier_id = s.id AND st.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.supplier_transactions
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_store_id ON public.supplier_transactions(store_id);

-- Add store_id to supplier_transaction_items
ALTER TABLE public.supplier_transaction_items
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set store_id based on parent transaction
UPDATE public.supplier_transaction_items sti
SET store_id = st.store_id
FROM public.supplier_transactions st
WHERE sti.transaction_id = st.id AND sti.store_id IS NULL;

-- Make store_id required
ALTER TABLE public.supplier_transaction_items
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_supplier_transaction_items_store_id ON public.supplier_transaction_items(store_id);

-- =====================================================
-- 6. ADD STORE_ID TO HR TABLES
-- =====================================================

-- Add store_id to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing employees
UPDATE public.employees
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.employees
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_employees_store_id ON public.employees(store_id);

-- Add store_id to employee_profiles
ALTER TABLE public.employee_profiles
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Set default store for existing employee profiles
UPDATE public.employee_profiles
SET store_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE store_id IS NULL;

-- Make store_id required
ALTER TABLE public.employee_profiles
ALTER COLUMN store_id SET NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_employee_profiles_store_id ON public.employee_profiles(store_id);

-- =====================================================
-- 7. ADD STORE_ID TO ANALYTICS/TRACKING TABLES
-- =====================================================

-- Add store_id to performance_logs (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'performance_logs') THEN
    ALTER TABLE public.performance_logs ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
    UPDATE public.performance_logs SET store_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE store_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_performance_logs_store_id ON public.performance_logs(store_id);
  END IF;
END$$;

-- Add store_id to product_recommendations (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_recommendations') THEN
    ALTER TABLE public.product_recommendations ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
    UPDATE public.product_recommendations SET store_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE store_id IS NULL;
    CREATE INDEX IF NOT EXISTS idx_product_recommendations_store_id ON public.product_recommendations(store_id);
  END IF;
END$$;

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN public.sales.store_id IS 'Store/location where this sale occurred';
COMMENT ON COLUMN public.products.store_id IS 'Store/location that owns this product inventory';
COMMENT ON COLUMN public.clients.store_id IS 'Store/location that manages this client';
COMMENT ON COLUMN public.repairs.store_id IS 'Store/location handling this repair';
COMMENT ON COLUMN public.suppliers.store_id IS 'Store/location that works with this supplier';
COMMENT ON COLUMN public.employees.store_id IS 'Store/location where employee works';

-- Fix the remaining issues without duplicate constraints

-- 1. Add missing foreign key constraints that don't already exist
DO $$
BEGIN
    -- Check and add sales_salesperson_id_fkey if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_salesperson_id_fkey' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE public.sales 
        ADD CONSTRAINT sales_salesperson_id_fkey 
        FOREIGN KEY (salesperson_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;

    -- Check and add sales_client_id_fkey if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_client_id_fkey' 
        AND table_name = 'sales'
    ) THEN
        ALTER TABLE public.sales 
        ADD CONSTRAINT sales_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;

    -- Check and add repairs_technician_id_fkey if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'repairs_technician_id_fkey' 
        AND table_name = 'repairs'
    ) THEN
        ALTER TABLE public.repairs 
        ADD CONSTRAINT repairs_technician_id_fkey 
        FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Check and add repairs_client_id_fkey if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'repairs_client_id_fkey' 
        AND table_name = 'repairs'
    ) THEN
        ALTER TABLE public.repairs 
        ADD CONSTRAINT repairs_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;

    -- Check and add repair_parts constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'repair_parts_product_id_fkey' 
        AND table_name = 'repair_parts'
    ) THEN
        ALTER TABLE public.repair_parts 
        ADD CONSTRAINT repair_parts_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'repair_parts_repair_id_fkey' 
        AND table_name = 'repair_parts'
    ) THEN
        ALTER TABLE public.repair_parts 
        ADD CONSTRAINT repair_parts_repair_id_fkey 
        FOREIGN KEY (repair_id) REFERENCES public.repairs(id) ON DELETE CASCADE;
    END IF;

    -- Check and add sale_items constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sale_items_product_id_fkey' 
        AND table_name = 'sale_items'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD CONSTRAINT sale_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sale_items_sale_id_fkey' 
        AND table_name = 'sale_items'
    ) THEN
        ALTER TABLE public.sale_items 
        ADD CONSTRAINT sale_items_sale_id_fkey 
        FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
    END IF;

    -- Check and add supplier transaction constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_transactions_supplier_id_fkey' 
        AND table_name = 'supplier_transactions'
    ) THEN
        ALTER TABLE public.supplier_transactions 
        ADD CONSTRAINT supplier_transactions_supplier_id_fkey 
        FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_transaction_items_transaction_id_fkey' 
        AND table_name = 'supplier_transaction_items'
    ) THEN
        ALTER TABLE public.supplier_transaction_items 
        ADD CONSTRAINT supplier_transaction_items_transaction_id_fkey 
        FOREIGN KEY (transaction_id) REFERENCES public.supplier_transactions(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_transaction_items_product_id_fkey' 
        AND table_name = 'supplier_transaction_items'
    ) THEN
        ALTER TABLE public.supplier_transaction_items 
        ADD CONSTRAINT supplier_transaction_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
    END IF;

    -- Check and add product recommendation constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_recommendations_product_id_fkey' 
        AND table_name = 'product_recommendations'
    ) THEN
        ALTER TABLE public.product_recommendations 
        ADD CONSTRAINT product_recommendations_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'product_recommendations_recommended_product_id_fkey' 
        AND table_name = 'product_recommendations'
    ) THEN
        ALTER TABLE public.product_recommendations 
        ADD CONSTRAINT product_recommendations_recommended_product_id_fkey 
        FOREIGN KEY (recommended_product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;

    -- Check and add products category constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_category_id_fkey' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Add missing triggers for audit trail (with existence checks)
DO $$
BEGIN
    -- Add update triggers only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_employees_updated_at' 
        AND event_object_table = 'employees'
    ) THEN
        CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_clients_updated_at' 
        AND event_object_table = 'clients'
    ) THEN
        CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON public.clients
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_suppliers_updated_at' 
        AND event_object_table = 'suppliers'
    ) THEN
        CREATE TRIGGER update_suppliers_updated_at
        BEFORE UPDATE ON public.suppliers
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_products_updated_at' 
        AND event_object_table = 'products'
    ) THEN
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 3. Add proper indexing for performance (with existence checks)
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_sales_salesperson_id ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_id ON public.repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_repairs_client_id ON public.repairs(client_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_id ON public.repair_parts(repair_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
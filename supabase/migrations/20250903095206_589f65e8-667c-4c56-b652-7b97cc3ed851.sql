BEGIN;

-- Tighten RLS for sales: only super_admin and salesperson (own records)
DROP POLICY IF EXISTS "Authorized users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Only admins and managers can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Role-based sales update access" ON public.sales;
DROP POLICY IF EXISTS "Role-based sales view access" ON public.sales;

-- SELECT policies
CREATE POLICY "Super admins can view all sales"
ON public.sales
FOR SELECT
USING (get_current_user_role() = 'super_admin');

CREATE POLICY "Salespersons can view own sales"
ON public.sales
FOR SELECT
USING (get_current_user_role() = 'salesperson' AND salesperson_id = auth.uid());

-- INSERT policies
CREATE POLICY "Super admins can insert sales"
ON public.sales
FOR INSERT
WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "Salespersons can insert own sales"
ON public.sales
FOR INSERT
WITH CHECK (get_current_user_role() = 'salesperson' AND salesperson_id = auth.uid());

-- UPDATE policies
CREATE POLICY "Super admins can update all sales"
ON public.sales
FOR UPDATE
USING (get_current_user_role() = 'super_admin');

CREATE POLICY "Salespersons can update own sales"
ON public.sales
FOR UPDATE
USING (get_current_user_role() = 'salesperson' AND salesperson_id = auth.uid());

-- DELETE policies
CREATE POLICY "Super admins can delete sales"
ON public.sales
FOR DELETE
USING (get_current_user_role() = 'super_admin');


-- Restrict supplier_transactions to super_admin only
DROP POLICY IF EXISTS "Admins and managers can delete transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authorized users can manage transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authorized users can update transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Authorized users can view transactions" ON public.supplier_transactions;

-- SELECT
CREATE POLICY "Super admins can view transactions"
ON public.supplier_transactions
FOR SELECT
USING (get_current_user_role() = 'super_admin');

-- INSERT
CREATE POLICY "Super admins can insert transactions"
ON public.supplier_transactions
FOR INSERT
WITH CHECK (get_current_user_role() = 'super_admin');

-- UPDATE
CREATE POLICY "Super admins can update transactions"
ON public.supplier_transactions
FOR UPDATE
USING (get_current_user_role() = 'super_admin');

-- DELETE
CREATE POLICY "Super admins can delete transactions"
ON public.supplier_transactions
FOR DELETE
USING (get_current_user_role() = 'super_admin');

COMMIT;
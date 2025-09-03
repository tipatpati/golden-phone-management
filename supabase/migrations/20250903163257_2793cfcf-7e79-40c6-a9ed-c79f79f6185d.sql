-- Strengthen financial data RLS without breaking existing functionality
-- 1) SALES: allow admins/managers to view all sales (in addition to existing salesperson + super_admin rules)
CREATE POLICY "Admins and managers can view all sales"
ON public.sales
FOR SELECT
USING (get_current_user_role() IN ('super_admin','admin','manager'));

-- 2) SALE_ITEMS: replace broad role-based ALL policy with scoped, ownership-aware policies
-- Drop overly permissive policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'sale_items' 
      AND policyname = 'Authorized users can manage sale items'
  ) THEN
    EXECUTE 'DROP POLICY "Authorized users can manage sale items" ON public.sale_items';
  END IF;
END $$;

-- Admins/managers/super_admin can manage all sale items
CREATE POLICY "Admins and managers can manage sale items"
ON public.sale_items
FOR ALL
USING (get_current_user_role() IN ('super_admin','admin','manager'))
WITH CHECK (get_current_user_role() IN ('super_admin','admin','manager'));

-- Salespersons can manage items only for their own sales
CREATE POLICY "Salespersons manage own sale items"
ON public.sale_items
FOR ALL
USING (
  get_current_user_role() = 'salesperson' AND 
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_items.sale_id 
      AND s.salesperson_id = auth.uid()
  )
)
WITH CHECK (
  get_current_user_role() = 'salesperson' AND 
  EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.id = sale_items.sale_id 
      AND s.salesperson_id = auth.uid()
  )
);
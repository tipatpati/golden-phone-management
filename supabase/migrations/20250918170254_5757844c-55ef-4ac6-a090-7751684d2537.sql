-- Remove the cross-salesperson access policy for specific sales
DROP POLICY IF EXISTS "Cross-salesperson access for specific sales" ON public.sales;
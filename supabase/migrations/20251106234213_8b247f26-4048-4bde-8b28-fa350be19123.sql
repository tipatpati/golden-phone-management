-- Enable public read access for sales receipts
-- This allows the public receipt viewer to work without authentication

-- Create a policy to allow public read access to sales data by sale_number
CREATE POLICY "Allow public read access to sales by sale_number"
ON public.sales
FOR SELECT
USING (true);

-- Create a policy to allow public read access to sale_items
CREATE POLICY "Allow public read access to sale_items"
ON public.sale_items
FOR SELECT
USING (true);

-- Create a policy to allow public read access to clients (needed for receipt viewer)
CREATE POLICY "Allow public read access to clients"
ON public.clients
FOR SELECT
USING (true);
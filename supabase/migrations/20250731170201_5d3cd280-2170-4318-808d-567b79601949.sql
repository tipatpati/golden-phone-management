-- Create the trigger on sale_items table to handle stock updates
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON sale_items;

CREATE TRIGGER trigger_update_product_stock_on_sale
  BEFORE INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_sale();

-- Enable real-time updates for products table so inventory updates immediately
ALTER TABLE products REPLICA IDENTITY FULL;

-- Add products table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
END $$;
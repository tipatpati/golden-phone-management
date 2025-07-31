-- Create the trigger on sale_items table to handle stock updates
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_sale ON sale_items;

CREATE TRIGGER trigger_update_product_stock_on_sale
  BEFORE INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_on_sale();
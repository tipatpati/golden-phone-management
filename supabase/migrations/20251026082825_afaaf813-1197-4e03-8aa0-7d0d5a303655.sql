-- Add store_id to core business tables
-- This migration adds store context to all business data

-- Add store_id to products table
ALTER TABLE products ADD COLUMN store_id uuid REFERENCES stores(id);

-- Add store_id to sales table
ALTER TABLE sales ADD COLUMN store_id uuid REFERENCES stores(id);

-- Add store_id to clients table
ALTER TABLE clients ADD COLUMN store_id uuid REFERENCES stores(id);

-- Add store_id to repairs table
ALTER TABLE repairs ADD COLUMN store_id uuid REFERENCES stores(id);

-- Add store_id to employees table
ALTER TABLE employees ADD COLUMN store_id uuid REFERENCES stores(id);

-- Add store_id to product_units table
ALTER TABLE product_units ADD COLUMN store_id uuid REFERENCES stores(id);

-- Create indexes for performance
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_clients_store_id ON clients(store_id);
CREATE INDEX idx_repairs_store_id ON repairs(store_id);
CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_product_units_store_id ON product_units(store_id);

-- Set existing records to first available store (migration helper)
-- In production, you should set these manually per business requirements
DO $$
DECLARE
  default_store_id uuid;
BEGIN
  -- Get the first active store
  SELECT id INTO default_store_id FROM stores WHERE is_active = true LIMIT 1;
  
  IF default_store_id IS NOT NULL THEN
    -- Update existing records with default store
    UPDATE products SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE sales SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE clients SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE repairs SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE employees SET store_id = default_store_id WHERE store_id IS NULL;
    UPDATE product_units SET store_id = default_store_id WHERE store_id IS NULL;
  END IF;
END $$;

-- Make store_id NOT NULL after setting defaults
ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE repairs ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE employees ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE product_units ALTER COLUMN store_id SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN products.store_id IS 'Store that owns this product';
COMMENT ON COLUMN sales.store_id IS 'Store where this sale was made';
COMMENT ON COLUMN clients.store_id IS 'Store that manages this client';
COMMENT ON COLUMN repairs.store_id IS 'Store handling this repair';
COMMENT ON COLUMN employees.store_id IS 'Primary store assignment for employee';
COMMENT ON COLUMN product_units.store_id IS 'Store that owns this product unit';
-- Add database indexes for better query performance
-- These indexes will significantly improve query speed for commonly used filters

-- Index for products table - most frequently queried fields
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_brand_model ON products(brand, model);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category_id, stock);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- Index for sales table - sales reporting and filtering
CREATE INDEX IF NOT EXISTS idx_sales_date_user ON sales(sale_date DESC, salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(status, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client_date ON sales(client_id, sale_date DESC) WHERE client_id IS NOT NULL;

-- Index for repairs table - repair tracking and filtering  
CREATE INDEX IF NOT EXISTS idx_repairs_status_date ON repairs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_date ON repairs(technician_id, created_at DESC) WHERE technician_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_repairs_priority_status ON repairs(priority, status);

-- Index for clients table - client search and lookup
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients(first_name, last_name) WHERE type = 'individual';
CREATE INDEX IF NOT EXISTS idx_clients_company_search ON clients(company_name) WHERE type = 'business';
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Index for employees table - employee management
CREATE INDEX IF NOT EXISTS idx_employees_status_dept ON employees(status, department);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_sale_items_product_date ON sale_items(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_date_type ON supplier_transactions(transaction_date DESC, type);
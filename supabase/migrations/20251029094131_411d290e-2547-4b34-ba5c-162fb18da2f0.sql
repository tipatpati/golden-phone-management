-- Add status field to products table for soft delete functionality
-- This preserves sales history while allowing products to be archived

-- Add status column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.products 
ADD CONSTRAINT products_status_check 
CHECK (status IN ('active', 'inactive', 'discontinued'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Update existing products to be active
UPDATE public.products 
SET status = 'active' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.status IS 'Product status: active (available for sale), inactive (archived), discontinued (no longer sold)';

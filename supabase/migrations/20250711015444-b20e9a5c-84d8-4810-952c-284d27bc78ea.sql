-- Add minimum and maximum selling price columns to products table
ALTER TABLE public.products 
ADD COLUMN min_price numeric DEFAULT 0,
ADD COLUMN max_price numeric DEFAULT 0;

-- Update existing products to set reasonable defaults
UPDATE public.products 
SET min_price = price * 0.8, 
    max_price = price * 1.5 
WHERE min_price = 0 AND max_price = 0;
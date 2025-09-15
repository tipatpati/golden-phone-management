-- Add condition column to product_units table
ALTER TABLE public.product_units 
ADD COLUMN condition text NOT NULL DEFAULT 'used' 
CHECK (condition IN ('new', 'used'));
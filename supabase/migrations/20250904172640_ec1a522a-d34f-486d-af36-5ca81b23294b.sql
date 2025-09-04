-- Add RAM field to product units for per-unit memory specification
ALTER TABLE public.product_units
ADD COLUMN IF NOT EXISTS ram INTEGER;
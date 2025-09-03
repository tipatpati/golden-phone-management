-- Add storage field to product_units table for phone storage capacity
ALTER TABLE public.product_units 
ADD COLUMN storage TEXT;
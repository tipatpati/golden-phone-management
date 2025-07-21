-- Remove SKU column from products table since we're using IMEI/serial numbers only
ALTER TABLE public.products DROP COLUMN IF EXISTS sku;
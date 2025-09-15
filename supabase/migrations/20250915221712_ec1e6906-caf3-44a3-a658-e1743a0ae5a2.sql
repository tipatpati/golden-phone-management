-- Fix critical security issues: Remove security definer views and add proper search_path

-- Drop the problematic security definer views
DROP VIEW IF EXISTS public.product_units_limited CASCADE;
DROP VIEW IF EXISTS public.product_effective_stock CASCADE;

-- Add proper search_path to functions that are missing it
ALTER FUNCTION public.search_brands(text, integer) SET search_path = public;
ALTER FUNCTION public.slugify(text) SET search_path = public;

-- Recreate the views without security definer
CREATE VIEW public.product_units_limited AS
SELECT 
  id, product_id, serial_number, barcode, status, color, storage, ram, battery_level,
  CASE WHEN can_view_purchase_price() THEN purchase_price ELSE NULL END as purchase_price,
  CASE WHEN can_view_purchase_price() THEN price ELSE NULL END as price,
  CASE WHEN can_view_purchase_price() THEN min_price ELSE NULL END as min_price,
  CASE WHEN can_view_purchase_price() THEN max_price ELSE NULL END as max_price,
  CASE WHEN can_view_purchase_price() THEN purchase_date ELSE NULL END as purchase_date,
  CASE WHEN can_view_purchase_price() THEN supplier_id ELSE NULL END as supplier_id,
  created_at, updated_at
FROM public.product_units;

-- Enable RLS on the new view
ALTER VIEW public.product_units_limited SET (security_invoker = true);

-- Create the product effective stock view 
CREATE VIEW public.product_effective_stock AS
SELECT 
  p.id as product_id,
  CASE 
    WHEN p.has_serial THEN (
      SELECT COUNT(*) FROM public.product_units pu 
      WHERE pu.product_id = p.id AND pu.status = 'available'
    )
    ELSE p.stock
  END as effective_stock
FROM public.products p;

-- Enable RLS on the new view
ALTER VIEW public.product_effective_stock SET (security_invoker = true);
-- Delete all products and units with barcodes starting with 'AppleiPhone0'

-- First delete product_units with matching barcodes or linked to products with matching barcodes
DELETE FROM public.product_units 
WHERE barcode ILIKE 'AppleiPhone0%' 
   OR product_id IN (
     SELECT id FROM public.products WHERE barcode ILIKE 'AppleiPhone0%'
   );

-- Then delete the products themselves
DELETE FROM public.products 
WHERE barcode ILIKE 'AppleiPhone0%';
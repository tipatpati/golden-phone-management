-- Add vat_included column to sales table
ALTER TABLE public.sales 
ADD COLUMN vat_included BOOLEAN NOT NULL DEFAULT true;
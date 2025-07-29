-- Add new columns for brand, model, and year
ALTER TABLE public.products 
ADD COLUMN brand text,
ADD COLUMN model text,
ADD COLUMN year integer;

-- Migrate existing product names to brand field and set defaults
UPDATE public.products 
SET brand = COALESCE(name, 'Unknown Brand'),
    model = 'Unknown Model'
WHERE brand IS NULL;

-- Make brand and model required
ALTER TABLE public.products 
ALTER COLUMN brand SET NOT NULL,
ALTER COLUMN model SET NOT NULL;

-- Drop the old name column
ALTER TABLE public.products 
DROP COLUMN name;

-- Update the search functionality in supabaseProducts to handle new fields
-- The search will now work across brand, model, year, serial numbers, and barcode
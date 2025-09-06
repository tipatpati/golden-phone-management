-- Add pricing fields to product_units table
ALTER TABLE public.product_units 
ADD COLUMN price NUMERIC,
ADD COLUMN min_price NUMERIC, 
ADD COLUMN max_price NUMERIC;

-- Make product-level pricing optional since pricing is now unit-specific
ALTER TABLE public.products 
ALTER COLUMN price DROP NOT NULL;

-- Update existing product_units with product pricing as defaults
UPDATE public.product_units pu
SET 
  price = p.price,
  min_price = p.min_price,
  max_price = p.max_price
FROM public.products p
WHERE pu.product_id = p.id
AND pu.price IS NULL;

-- Add validation function for unit-level pricing
CREATE OR REPLACE FUNCTION public.validate_unit_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that selling prices are greater than base price
  IF NEW.price IS NOT NULL THEN
    IF NEW.min_price IS NOT NULL AND NEW.min_price <= NEW.price THEN
      RAISE EXCEPTION 'Unit minimum selling price must be greater than base price for serial %', NEW.serial_number;
    END IF;
    IF NEW.max_price IS NOT NULL AND NEW.max_price <= NEW.price THEN
      RAISE EXCEPTION 'Unit maximum selling price must be greater than base price for serial %', NEW.serial_number;
    END IF;
  END IF;
  
  -- Validate min < max price relationship
  IF NEW.min_price IS NOT NULL AND NEW.max_price IS NOT NULL AND NEW.min_price >= NEW.max_price THEN
    RAISE EXCEPTION 'Unit minimum price must be less than maximum price for serial %', NEW.serial_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unit pricing validation
CREATE TRIGGER validate_unit_pricing_trigger
  BEFORE INSERT OR UPDATE ON public.product_units
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_unit_pricing();

-- Add comment explaining the pricing model
COMMENT ON COLUMN public.product_units.price IS 'Base purchase price for this specific unit';
COMMENT ON COLUMN public.product_units.min_price IS 'Minimum selling price for this specific unit';
COMMENT ON COLUMN public.product_units.max_price IS 'Maximum selling price for this specific unit';
COMMENT ON COLUMN public.products.price IS 'Optional default purchase price for new units of this product';
-- Add unit-level pricing columns (nullable) if not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'product_units' AND column_name = 'price'
  ) THEN
    ALTER TABLE public.product_units ADD COLUMN price NUMERIC;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'product_units' AND column_name = 'min_price'
  ) THEN
    ALTER TABLE public.product_units ADD COLUMN min_price NUMERIC;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'product_units' AND column_name = 'max_price'
  ) THEN
    ALTER TABLE public.product_units ADD COLUMN max_price NUMERIC;
  END IF;
END $$;

-- Validation function for unit pricing
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

-- Create trigger if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'validate_unit_pricing_trigger' AND n.nspname = 'public' AND c.relname = 'product_units'
  ) THEN
    CREATE TRIGGER validate_unit_pricing_trigger
      BEFORE INSERT OR UPDATE ON public.product_units
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_unit_pricing();
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.product_units.price IS 'Base purchase price for this specific unit';
COMMENT ON COLUMN public.product_units.min_price IS 'Minimum selling price for this specific unit';
COMMENT ON COLUMN public.product_units.max_price IS 'Maximum selling price for this specific unit';
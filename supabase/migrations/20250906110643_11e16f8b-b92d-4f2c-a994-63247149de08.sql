-- Enforce uniqueness for product unit serial numbers (IMEIs) and barcodes via trigger-based validation
-- This avoids failing existing data while preventing new duplicates

-- Function: validate uniqueness on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.validate_unique_product_unit_identifiers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_id uuid;
  cleaned_serial text;
  cleaned_barcode text;
BEGIN
  -- Normalize values by trimming whitespace; treat empty strings as NULL
  cleaned_serial := NULLIF(btrim(NEW.serial_number), '');
  cleaned_barcode := NULLIF(btrim(NEW.barcode), '');

  -- Check duplicate serial/IMEI across product_units
  IF cleaned_serial IS NOT NULL THEN
    SELECT id INTO existing_id
    FROM public.product_units
    WHERE btrim(serial_number) = cleaned_serial
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      RAISE EXCEPTION 'Duplicate serial/IMEI "%" already exists (unit id=%)', cleaned_serial, existing_id
        USING ERRCODE = '23505'; -- unique_violation
    END IF;
  END IF;

  -- Check duplicate barcode across product_units
  IF cleaned_barcode IS NOT NULL THEN
    SELECT id INTO existing_id
    FROM public.product_units
    WHERE btrim(barcode) = cleaned_barcode
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      RAISE EXCEPTION 'Duplicate barcode "%" already exists (unit id=%)', cleaned_barcode, existing_id
        USING ERRCODE = '23505'; -- unique_violation
    END IF;
  END IF;

  -- Persist normalized values
  NEW.serial_number := cleaned_serial;
  NEW.barcode := cleaned_barcode;

  RETURN NEW;
END;
$$;

-- Trigger: apply validation to product_units
DROP TRIGGER IF EXISTS trg_validate_unique_identifiers ON public.product_units;
CREATE TRIGGER trg_validate_unique_identifiers
BEFORE INSERT OR UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.validate_unique_product_unit_identifiers();
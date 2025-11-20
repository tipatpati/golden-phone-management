-- Assign all products to main store
-- This migration ensures all products are associated with the main store

DO $$
DECLARE
  main_store_id uuid;
  updated_count integer;
BEGIN
  -- Get the main store ID (first by code 'MAIN', then by oldest store)
  SELECT id INTO main_store_id
  FROM public.stores
  WHERE code = 'MAIN' OR code ILIKE '%main%'
  ORDER BY created_at ASC
  LIMIT 1;

  -- If no store found with 'MAIN' code, get the oldest active store
  IF main_store_id IS NULL THEN
    SELECT id INTO main_store_id
    FROM public.stores
    WHERE is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- If still no store found, raise an error
  IF main_store_id IS NULL THEN
    RAISE EXCEPTION 'No active store found in the database. Please create a store first.';
  END IF;

  -- Update all products to be assigned to the main store
  UPDATE public.products
  SET store_id = main_store_id, updated_at = now()
  WHERE store_id IS NULL OR store_id != main_store_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RAISE NOTICE 'Assigned % products to main store (ID: %)', updated_count, main_store_id;
END $$;

-- Add a comment to track this migration
COMMENT ON TABLE public.products IS 'All products are assigned to their respective stores. Main store assignment completed.';
-- Add item-level discount support to sale_items table

-- First, add updated_at column if it doesn't exist
ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add discount columns to sale_items
ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS discount_type text CHECK (discount_type IN ('percentage', 'amount')),
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0 CHECK (discount_value >= 0),
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0);

-- Add comments for clarity
COMMENT ON COLUMN public.sale_items.discount_type IS 'Type of discount applied: percentage or amount';
COMMENT ON COLUMN public.sale_items.discount_value IS 'The discount value (percentage or fixed amount)';
COMMENT ON COLUMN public.sale_items.discount_amount IS 'The calculated discount amount in currency';

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_sale_items_updated_at'
  ) THEN
    CREATE TRIGGER update_sale_items_updated_at
    BEFORE UPDATE ON public.sale_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
-- Add hybrid payment and discount support to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_transfer_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'single' CHECK (payment_type IN ('single', 'hybrid'));

-- Update existing sales to have payment_type as 'single' and set appropriate amounts
UPDATE public.sales 
SET payment_type = 'single',
    cash_amount = CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END,
    card_amount = CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END,
    bank_transfer_amount = CASE WHEN payment_method = 'bank_transfer' THEN total_amount ELSE 0 END
WHERE payment_type IS NULL;
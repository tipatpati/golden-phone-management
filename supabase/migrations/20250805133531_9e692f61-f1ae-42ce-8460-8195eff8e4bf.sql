-- Update payment_method check constraint to include hybrid
ALTER TABLE public.sales 
DROP CONSTRAINT IF EXISTS sales_payment_method_check;

ALTER TABLE public.sales 
ADD CONSTRAINT sales_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'hybrid', 'other'));
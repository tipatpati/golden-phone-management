-- Phase 1: Database Schema Updates for Supplier Acquisition Feature

-- Add supplier tracking fields to product_units table
ALTER TABLE public.product_units 
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id),
ADD COLUMN purchase_price numeric,
ADD COLUMN purchase_date timestamp with time zone DEFAULT now();

-- Add indexes for performance
CREATE INDEX idx_product_units_supplier_id ON public.product_units(supplier_id);
CREATE INDEX idx_product_units_purchase_date ON public.product_units(purchase_date);

-- Enhance supplier_transaction_items table with unit tracking
ALTER TABLE public.supplier_transaction_items
ADD COLUMN product_unit_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN creates_new_product boolean DEFAULT false,
ADD COLUMN unit_details jsonb DEFAULT '{}'::jsonb;

-- Add index for product_unit_ids for efficient queries
CREATE INDEX idx_supplier_transaction_items_unit_ids ON public.supplier_transaction_items USING GIN(product_unit_ids);

-- Add comments for documentation
COMMENT ON COLUMN public.product_units.supplier_id IS 'Reference to the supplier that provided this unit';
COMMENT ON COLUMN public.product_units.purchase_price IS 'Acquisition cost for this specific unit';
COMMENT ON COLUMN public.product_units.purchase_date IS 'Date when this unit was acquired from supplier';
COMMENT ON COLUMN public.supplier_transaction_items.product_unit_ids IS 'Array of product unit IDs created or updated by this transaction item';
COMMENT ON COLUMN public.supplier_transaction_items.creates_new_product IS 'Whether this item creates a new product or restocks existing';
COMMENT ON COLUMN public.supplier_transaction_items.unit_details IS 'Unit-specific details like serial numbers, colors, storage variants';
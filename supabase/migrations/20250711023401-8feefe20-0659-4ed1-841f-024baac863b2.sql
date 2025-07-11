-- Create product_recommendations table to store accessory recommendations
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  recommended_product_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL DEFAULT 'accessory',
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_product_recommendations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_recommendations_recommended FOREIGN KEY (recommended_product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT unique_product_recommendation UNIQUE (product_id, recommended_product_id)
);

-- Enable RLS
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view recommendations" 
ON public.product_recommendations 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can create recommendations" 
ON public.product_recommendations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update recommendations" 
ON public.product_recommendations 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete recommendations" 
ON public.product_recommendations 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_recommendations_updated_at
BEFORE UPDATE ON public.product_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_product_recommendations_product_id ON public.product_recommendations(product_id);
CREATE INDEX idx_product_recommendations_recommended_id ON public.product_recommendations(recommended_product_id);
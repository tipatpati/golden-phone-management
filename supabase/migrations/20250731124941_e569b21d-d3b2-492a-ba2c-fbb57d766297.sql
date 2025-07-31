-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES public.categories(id),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create models table
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES public.categories(id),
  storage_variants TEXT[] DEFAULT '{}',
  color_variants TEXT[] DEFAULT '{}',
  release_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Create policies for brands
CREATE POLICY "Brands are viewable by everyone" 
ON public.brands FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage brands" 
ON public.brands FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Create policies for models
CREATE POLICY "Models are viewable by everyone" 
ON public.models FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage models" 
ON public.models FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Add update triggers
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert major brands across categories
INSERT INTO public.brands (name, category_id) VALUES
-- Mobile phones (category 1)
('Apple', 1),
('Samsung', 1),
('Google', 1),
('OnePlus', 1),
('Xiaomi', 1),
('Huawei', 1),
('Oppo', 1),
('Vivo', 1),
('Realme', 1),
('Motorola', 1),
('Sony', 1),
('Nokia', 1),

-- Tablets (category 3, assuming exists)
('Microsoft', 3),
('Lenovo', 3),

-- Laptops (category 4, assuming exists)
('Dell', 4),
('HP', 4),
('ASUS', 4),
('Acer', 4),
('MSI', 4),

-- Accessories (category 2)
('Anker', 2),
('Belkin', 2),
('Logitech', 2),
('Razer', 2),
('SteelSeries', 2),

-- Audio (category 5, assuming exists)
('Bose', 5),
('JBL', 5),
('Sennheiser', 5),
('Audio-Technica', 5);

-- Insert popular models with storage and color variants
WITH brand_data AS (
  SELECT id, name FROM public.brands
)
INSERT INTO public.models (brand_id, name, category_id, storage_variants, color_variants, release_year) 
SELECT 
  b.id,
  model_data.name,
  model_data.category_id,
  model_data.storage_variants,
  model_data.color_variants,
  model_data.release_year
FROM brand_data b
JOIN (VALUES
  -- Apple iPhones
  ('Apple', 'iPhone 15 Pro Max', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], 2023),
  ('Apple', 'iPhone 15 Pro', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'], 2023),
  ('Apple', 'iPhone 15 Plus', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Pink', 'Yellow', 'Green', 'Blue', 'Black'], 2023),
  ('Apple', 'iPhone 15', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Pink', 'Yellow', 'Green', 'Blue', 'Black'], 2023),
  ('Apple', 'iPhone 14 Pro Max', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Deep Purple', 'Gold', 'Silver', 'Space Black'], 2022),
  ('Apple', 'iPhone 14 Pro', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Deep Purple', 'Gold', 'Silver', 'Space Black'], 2022),
  ('Apple', 'iPhone 14 Plus', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Blue', 'Purple', 'Midnight', 'Starlight', 'Red'], 2022),
  ('Apple', 'iPhone 14', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Blue', 'Purple', 'Midnight', 'Starlight', 'Red'], 2022),
  ('Apple', 'iPhone 13 Pro Max', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Graphite', 'Gold', 'Silver', 'Sierra Blue'], 2021),
  ('Apple', 'iPhone 13 Pro', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Graphite', 'Gold', 'Silver', 'Sierra Blue'], 2021),
  ('Apple', 'iPhone 13', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Pink', 'Blue', 'Midnight', 'Starlight', 'Red'], 2021),
  ('Apple', 'iPhone 13 mini', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Pink', 'Blue', 'Midnight', 'Starlight', 'Red'], 2021),
  ('Apple', 'iPhone 12 Pro Max', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Graphite', 'Silver', 'Gold', 'Pacific Blue'], 2020),
  ('Apple', 'iPhone 12 Pro', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Graphite', 'Silver', 'Gold', 'Pacific Blue'], 2020),
  ('Apple', 'iPhone 12', 1, ARRAY['64GB', '128GB', '256GB'], ARRAY['Black', 'White', 'Red', 'Green', 'Blue', 'Purple'], 2020),
  ('Apple', 'iPhone 12 mini', 1, ARRAY['64GB', '128GB', '256GB'], ARRAY['Black', 'White', 'Red', 'Green', 'Blue', 'Purple'], 2020),

  -- Apple iPads
  ('Apple', 'iPad Pro 12.9', 3, ARRAY['128GB', '256GB', '512GB', '1TB', '2TB'], ARRAY['Silver', 'Space Gray'], 2023),
  ('Apple', 'iPad Pro 11', 3, ARRAY['128GB', '256GB', '512GB', '1TB', '2TB'], ARRAY['Silver', 'Space Gray'], 2023),
  ('Apple', 'iPad Air', 3, ARRAY['64GB', '256GB'], ARRAY['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue'], 2022),
  ('Apple', 'iPad', 3, ARRAY['64GB', '256GB'], ARRAY['Silver', 'Space Gray'], 2022),
  ('Apple', 'iPad mini', 3, ARRAY['64GB', '256GB'], ARRAY['Space Gray', 'Pink', 'Purple', 'Starlight'], 2021),

  -- Apple MacBooks
  ('Apple', 'MacBook Pro 16', 4, ARRAY['512GB', '1TB', '2TB', '4TB', '8TB'], ARRAY['Silver', 'Space Gray'], 2023),
  ('Apple', 'MacBook Pro 14', 4, ARRAY['512GB', '1TB', '2TB', '4TB', '8TB'], ARRAY['Silver', 'Space Gray'], 2023),
  ('Apple', 'MacBook Air 15', 4, ARRAY['256GB', '512GB', '1TB', '2TB'], ARRAY['Midnight', 'Starlight', 'Silver', 'Space Gray'], 2023),
  ('Apple', 'MacBook Air 13', 4, ARRAY['256GB', '512GB', '1TB', '2TB'], ARRAY['Midnight', 'Starlight', 'Silver', 'Space Gray'], 2022),

  -- Samsung Galaxy S Series
  ('Samsung', 'Galaxy S24 Ultra', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'], 2024),
  ('Samsung', 'Galaxy S24+', 1, ARRAY['256GB', '512GB'], ARRAY['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'], 2024),
  ('Samsung', 'Galaxy S24', 1, ARRAY['128GB', '256GB'], ARRAY['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'], 2024),
  ('Samsung', 'Galaxy S23 Ultra', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Phantom Black', 'Cream', 'Green', 'Lavender'], 2023),
  ('Samsung', 'Galaxy S23+', 1, ARRAY['256GB', '512GB'], ARRAY['Phantom Black', 'Cream', 'Green', 'Lavender'], 2023),
  ('Samsung', 'Galaxy S23', 1, ARRAY['128GB', '256GB'], ARRAY['Phantom Black', 'Cream', 'Green', 'Lavender'], 2023),
  ('Samsung', 'Galaxy S22 Ultra', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Phantom Black', 'Phantom White', 'Burgundy', 'Green'], 2022),
  ('Samsung', 'Galaxy S22+', 1, ARRAY['128GB', '256GB'], ARRAY['Phantom Black', 'Phantom White', 'Pink Gold', 'Green'], 2022),
  ('Samsung', 'Galaxy S22', 1, ARRAY['128GB', '256GB'], ARRAY['Phantom Black', 'Phantom White', 'Pink Gold', 'Green'], 2022),

  -- Samsung Galaxy Note/Fold/Flip
  ('Samsung', 'Galaxy Z Fold5', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Phantom Black', 'Cream', 'Icy Blue'], 2023),
  ('Samsung', 'Galaxy Z Flip5', 1, ARRAY['256GB', '512GB'], ARRAY['Mint', 'Graphite', 'Cream', 'Lavender'], 2023),
  ('Samsung', 'Galaxy Z Fold4', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Graygreen', 'Phantom Black', 'Beige'], 2022),
  ('Samsung', 'Galaxy Z Flip4', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Bora Purple', 'Graphite', 'Pink Gold', 'Blue'], 2022),

  -- Samsung Tablets
  ('Samsung', 'Galaxy Tab S9 Ultra', 3, ARRAY['256GB', '512GB', '1TB'], ARRAY['Graphite', 'Beige'], 2023),
  ('Samsung', 'Galaxy Tab S9+', 3, ARRAY['256GB', '512GB'], ARRAY['Graphite', 'Beige'], 2023),
  ('Samsung', 'Galaxy Tab S9', 3, ARRAY['128GB', '256GB'], ARRAY['Graphite', 'Beige'], 2023),
  ('Samsung', 'Galaxy Tab A9+', 3, ARRAY['64GB', '128GB'], ARRAY['Graphite', 'Silver'], 2023),

  -- Google Pixels
  ('Google', 'Pixel 8 Pro', 1, ARRAY['128GB', '256GB', '512GB', '1TB'], ARRAY['Obsidian', 'Porcelain', 'Bay'], 2023),
  ('Google', 'Pixel 8', 1, ARRAY['128GB', '256GB'], ARRAY['Obsidian', 'Hazel', 'Rose'], 2023),
  ('Google', 'Pixel 7 Pro', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Obsidian', 'Snow', 'Hazel'], 2022),
  ('Google', 'Pixel 7', 1, ARRAY['128GB', '256GB'], ARRAY['Obsidian', 'Snow', 'Lemongrass'], 2022),
  ('Google', 'Pixel 6 Pro', 1, ARRAY['128GB', '256GB', '512GB'], ARRAY['Stormy Black', 'Cloudy White', 'Sorta Sunny'], 2021),
  ('Google', 'Pixel 6', 1, ARRAY['128GB', '256GB'], ARRAY['Stormy Black', 'Sorta Seafoam', 'Kinda Coral'], 2021),

  -- OnePlus
  ('OnePlus', '12', 1, ARRAY['256GB', '512GB'], ARRAY['Silky Black', 'Flowy Emerald'], 2024),
  ('OnePlus', '11', 1, ARRAY['128GB', '256GB'], ARRAY['Titan Black', 'Eternal Green'], 2023),
  ('OnePlus', '10 Pro', 1, ARRAY['128GB', '256GB'], ARRAY['Volcanic Black', 'Emerald Forest'], 2022),
  ('OnePlus', '10T', 1, ARRAY['128GB', '256GB'], ARRAY['Moonstone Black', 'Jade Green'], 2022),
  ('OnePlus', 'Nord 3', 1, ARRAY['128GB', '256GB'], ARRAY['Misty Green', 'Tempest Gray'], 2023),

  -- Xiaomi
  ('Xiaomi', '14 Ultra', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Black', 'White'], 2024),
  ('Xiaomi', '14', 1, ARRAY['256GB', '512GB'], ARRAY['Black', 'White', 'Green'], 2024),
  ('Xiaomi', '13 Ultra', 1, ARRAY['256GB', '512GB', '1TB'], ARRAY['Black', 'White', 'Olive Green'], 2023),
  ('Xiaomi', '13 Pro', 1, ARRAY['256GB', '512GB'], ARRAY['Ceramic Black', 'Ceramic White', 'Flora Green'], 2023),
  ('Xiaomi', '13', 1, ARRAY['128GB', '256GB'], ARRAY['Black', 'White', 'Pink'], 2023),
  ('Xiaomi', 'Redmi Note 13 Pro', 1, ARRAY['128GB', '256GB'], ARRAY['Midnight Black', 'Ocean Teal', 'Coral Purple'], 2024),

  -- Sony
  ('Sony', 'Xperia 1 V', 1, ARRAY['256GB', '512GB'], ARRAY['Black', 'Platinum Silver', 'Khaki Green'], 2023),
  ('Sony', 'Xperia 5 V', 1, ARRAY['128GB', '256GB'], ARRAY['Black', 'Platinum Silver', 'Blue'], 2023),
  ('Sony', 'Xperia 10 V', 1, ARRAY['128GB'], ARRAY['Black', 'White', 'Sage Green', 'Lavender'], 2023),

  -- Audio Products
  ('Apple', 'AirPods Pro 2', 5, ARRAY[''], ARRAY['White'], 2022),
  ('Apple', 'AirPods 3', 5, ARRAY[''], ARRAY['White'], 2021),
  ('Apple', 'AirPods Max', 5, ARRAY[''], ARRAY['Space Gray', 'Silver', 'Sky Blue', 'Green', 'Pink'], 2020),
  ('Sony', 'WH-1000XM5', 5, ARRAY[''], ARRAY['Black', 'Silver'], 2022),
  ('Sony', 'WH-1000XM4', 5, ARRAY[''], ARRAY['Black', 'Silver', 'Blue'], 2020),
  ('Sony', 'WF-1000XM4', 5, ARRAY[''], ARRAY['Black', 'Silver'], 2021),
  ('Bose', 'QuietComfort 45', 5, ARRAY[''], ARRAY['Black', 'White Smoke'], 2021),
  ('Bose', 'QuietComfort Earbuds', 5, ARRAY[''], ARRAY['Triple Black', 'Soapstone'], 2020),
  ('JBL', 'Live 660NC', 5, ARRAY[''], ARRAY['Black', 'Blue', 'Pink', 'White'], 2021),
  ('Sennheiser', 'Momentum 4', 5, ARRAY[''], ARRAY['Black', 'White'], 2022)

) AS model_data(brand_name, name, category_id, storage_variants, color_variants, release_year) 
ON b.name = model_data.brand_name;
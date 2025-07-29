-- Add battery_level column to products table
ALTER TABLE public.products 
ADD COLUMN battery_level integer;

-- Add constraint to ensure battery level is between 0 and 100
ALTER TABLE public.products 
ADD CONSTRAINT battery_level_range CHECK (battery_level >= 0 AND battery_level <= 100);

-- Update existing products with realistic battery levels
UPDATE public.products 
SET battery_level = CASE 
  WHEN brand = 'Apple' THEN 85 + (random() * 15)::integer
  WHEN brand = 'Samsung' THEN 80 + (random() * 20)::integer
  WHEN brand = 'Google' THEN 75 + (random() * 25)::integer
  WHEN brand = 'OnePlus' THEN 70 + (random() * 30)::integer
  WHEN brand = 'Xiaomi' THEN 65 + (random() * 35)::integer
  WHEN brand = 'Huawei' THEN 60 + (random() * 40)::integer
  WHEN brand = 'Sony' THEN 75 + (random() * 25)::integer
  WHEN brand = 'Microsoft' THEN 80 + (random() * 20)::integer
  WHEN brand = 'Dell' THEN 70 + (random() * 30)::integer
  WHEN brand = 'HP' THEN 65 + (random() * 35)::integer
  WHEN brand = 'Lenovo' THEN 60 + (random() * 40)::integer
  WHEN brand = 'Asus' THEN 70 + (random() * 30)::integer
  WHEN brand = 'Acer' THEN 65 + (random() * 35)::integer
  WHEN brand = 'Bose' THEN 90 + (random() * 10)::integer
  WHEN brand = 'JBL' THEN 85 + (random() * 15)::integer
  WHEN brand = 'Anker' THEN 95 + (random() * 5)::integer
  WHEN brand = 'Belkin' THEN 90 + (random() * 10)::integer
  WHEN brand = 'Logitech' THEN 85 + (random() * 15)::integer
  WHEN brand = 'Canon' THEN 80 + (random() * 20)::integer
  WHEN brand = 'Nintendo' THEN 75 + (random() * 25)::integer
  ELSE 50 + (random() * 50)::integer
END;
-- Update any products using Smartphones category to use Phones instead
UPDATE products SET category_id = 1 WHERE category_id = 13;

-- Update any brands using Smartphones category to use Phones instead  
UPDATE brands SET category_id = 1 WHERE category_id = 13;

-- Update any models using Smartphones category to use Phones instead
UPDATE models SET category_id = 1 WHERE category_id = 13;

-- Delete the duplicate Smartphones category
DELETE FROM categories WHERE id = 13;
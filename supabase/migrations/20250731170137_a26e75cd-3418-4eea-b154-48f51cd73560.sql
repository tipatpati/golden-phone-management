-- First, let's check and ensure our triggers are properly set up
-- Check if triggers exist for sale_items table
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing,
    t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'sale_items'
ORDER BY t.trigger_name;

-- Also check the function that handles stock updates
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_product_stock_on_sale';
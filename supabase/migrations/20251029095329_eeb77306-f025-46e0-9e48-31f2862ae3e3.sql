-- Assign current user to Main Store
INSERT INTO user_stores (user_id, store_id, is_default)
SELECT auth.uid(), '00000000-0000-0000-0000-000000000001', true
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, store_id) DO UPDATE SET is_default = true;
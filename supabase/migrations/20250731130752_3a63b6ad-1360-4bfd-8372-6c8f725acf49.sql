-- Revert the product insert policy to only allow admin, manager, and inventory_manager
DROP POLICY IF EXISTS "Inventory managers can insert products" ON public.products;

CREATE POLICY "Inventory managers can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::app_role, 'manager'::app_role, 'inventory_manager'::app_role]));

-- Update user benbekhtiamir@gmail.com to super_admin role
UPDATE public.profiles 
SET role = 'super_admin'::app_role 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'benbekhtiamir@gmail.com'
);

-- Also update the user_roles table
UPDATE public.user_roles 
SET role = 'super_admin'::app_role 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'benbekhtiamir@gmail.com'
);
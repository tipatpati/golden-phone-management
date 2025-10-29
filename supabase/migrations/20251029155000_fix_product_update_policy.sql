-- Fix product update policy to allow stock updates
-- Issue: Super admins couldn't update products because the policy checked store_id match
-- even though super admins should be able to update products from any store

DROP POLICY IF EXISTS "Inventory managers can update products" ON products;

CREATE POLICY "Inventory managers can update products"
ON products FOR UPDATE
TO authenticated
USING (
  -- Super admins can update any product regardless of store
  get_current_user_role() = 'super_admin'
  OR (
    -- Other roles can only update products from their current store
    get_current_user_role() IN ('admin', 'manager', 'inventory_manager')
    AND store_id = get_user_current_store_id()
  )
);

COMMENT ON POLICY "Inventory managers can update products" ON products IS
'Super admins can update any product from any store.
Other authorized roles can only update products from their currently selected store.';

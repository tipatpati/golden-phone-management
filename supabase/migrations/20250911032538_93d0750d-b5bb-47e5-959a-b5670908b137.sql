-- Temporary: allow authenticated users to delete supplier transaction items to unblock parent deletion
DROP POLICY IF EXISTS "Authenticated users can delete supplier transaction items" ON supplier_transaction_items;

CREATE POLICY "Authenticated users can delete supplier transaction items"
ON supplier_transaction_items
FOR DELETE
TO authenticated
USING (true);

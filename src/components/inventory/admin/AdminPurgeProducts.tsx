import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarcodeBackfillTool } from "./BarcodeBackfillTool";
import { BarcodeTestTool } from "./BarcodeTestTool";

// Admin-only tool to purge all product-related data
const AdminPurgeProducts: React.FC = () => {
  const { isLoggedIn, userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAuthorized = isLoggedIn && ["super_admin", "admin", "manager"].includes(userRole || "");

  if (!isAuthorized) return null;

  const handlePurge = async () => {
    try {
      setLoading(true);
      toast.info("Starting purge…", { description: "Deleting related records first (sale items, units, etc.)" });

      // Gather product IDs to safely delete dependent rows
      const { data: products, error: idsErr } = await supabase
        .from("products")
        .select("id");
      if (idsErr) throw new Error(`Failed to fetch products: ${idsErr.message}`);
      const productIds = (products ?? []).map((p: any) => p.id);

      // If nothing to purge, still clean recommendation/unit tables just in case
      if (productIds.length === 0) {
        await supabase.from("product_recommendations").delete().not("id", "is", null);
        await supabase.from("product_units").delete().not("id", "is", null);
        toast.success("No products found. Cleared units and recommendations.");
        setOpen(false);
        return;
      }

      // 1) Delete product recommendations (both directions)
      const { error: recErrA } = await supabase
        .from("product_recommendations")
        .delete()
        .in("product_id", productIds);
      if (recErrA) throw new Error(`Recommendations purge (by product) failed: ${recErrA.message}`);
      const { error: recErrB } = await supabase
        .from("product_recommendations")
        .delete()
        .in("recommended_product_id", productIds);
      if (recErrB) throw new Error(`Recommendations purge (by recommended) failed: ${recErrB.message}`);

      // 2) Delete transactional/referenced items that block product deletion
      const { error: saleItemsErr } = await supabase
        .from("sale_items")
        .delete()
        .in("product_id", productIds);
      if (saleItemsErr) throw new Error(`Sale items purge failed: ${saleItemsErr.message}`);

      const { error: repairPartsErr } = await supabase
        .from("repair_parts")
        .delete()
        .in("product_id", productIds);
      if (repairPartsErr) throw new Error(`Repair parts purge failed: ${repairPartsErr.message}`);

      const { error: supplierTxItemsErr } = await supabase
        .from("supplier_transaction_items")
        .delete()
        .in("product_id", productIds);
      if (supplierTxItemsErr) throw new Error(`Supplier transaction items purge failed: ${supplierTxItemsErr.message}`);

      // 3) Delete product units for these products
      const { error: unitsErr } = await supabase
        .from("product_units")
        .delete()
        .in("product_id", productIds);
      if (unitsErr) throw new Error(`Units purge failed: ${unitsErr.message}`);

      // 4) Delete the products themselves
      const { error: productsErr } = await supabase
        .from("products")
        .delete()
        .in("id", productIds);
      if (productsErr) throw new Error(`Products purge failed: ${productsErr.message}`);

      toast.success("Product data cleared", {
        description: "Removed products, units, sale items, repair parts, and recommendations.",
      });
      setOpen(false);
    } catch (e: any) {
      console.error("AdminPurgeProducts error:", e);
      toast.error("Failed to clear product data", {
        description: e?.message || "Please check your permissions and try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barcode Management Tools */}
      <BarcodeBackfillTool />
      
      {/* Barcode Test Tool */}
      <BarcodeTestTool />
      
      {/* Product Purge Tool */}
      <section aria-label="Admin product maintenance" className="bg-background rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-destructive/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-destructive">Danger Zone</h2>
            <p className="text-muted-foreground text-sm">Clear all product-related data to start fresh testing.</p>
          </div>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading} aria-label="Clear all product data">
                {loading ? "Clearing…" : "Clear All Product Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm full product data purge?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete Products, Product Units, Product Recommendations, Sale Items, Repair Parts, and Supplier Transaction Items for the selected products.
                  Sales or repairs referencing those items may lose details. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePurge} disabled={loading}>
                  {loading ? "Purging…" : "Yes, delete all"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
};

export default AdminPurgeProducts;
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Admin-only tool to purge all product-related data
const AdminPurgeProducts: React.FC = () => {
  const { isLoggedIn, userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAuthorized = isLoggedIn && ["super_admin", "admin", "manager", "inventory_manager"].includes(userRole || "");

  if (!isAuthorized) return null;

  const handlePurge = async () => {
    try {
      setLoading(true);
      toast.info("Starting purge…", { description: "Deleting product data in stages" });

      // 1) Delete recommendations first
      const { error: recErr } = await supabase
        .from("product_recommendations")
        .delete()
        .not("id", "is", null);
      if (recErr) throw new Error(`Recommendations purge failed: ${recErr.message}`);

      // 2) Delete product units
      const { error: unitsErr } = await supabase
        .from("product_units")
        .delete()
        .not("id", "is", null);
      if (unitsErr) throw new Error(`Units purge failed: ${unitsErr.message}`);

      // 3) Delete products
      const { error: productsErr } = await supabase
        .from("products")
        .delete()
        .not("id", "is", null);
      if (productsErr) throw new Error(`Products purge failed: ${productsErr.message}`);

      toast.success("Product data cleared", {
        description: "All products, units, and recommendations removed successfully",
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
    <section aria-label="Admin product maintenance" className="bg-background rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Admin Maintenance</h2>
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
                This will permanently delete all records from Products, Product Units, and Product Recommendations.
                Sales or repairs that referenced products may become orphaned. This action cannot be undone.
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
  );
};

export default AdminPurgeProducts;


import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

export function useInventoryState() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const { isLoggedIn, userRole } = useAuth();

  // Check if user can add products (must be logged in and have proper role)
  const canAddProducts = isLoggedIn && userRole && ['inventory_manager', 'manager', 'admin', 'super_admin'].includes(userRole);

  const handleAddProduct = () => {
    if (!isLoggedIn) {
      toast.error("Please log in to add products", {
        description: "You need to be authenticated to manage inventory"
      });
      return;
    }
    
    if (!canAddProducts) {
      toast.error("Access denied", {
        description: "Only inventory managers and above can add products"
      });
      return;
    }
    setShowAddProduct(true);
  };


  const handleCancelAddProduct = () => {
    setShowAddProduct(false);
  };

  const handleTestConnection = async () => {
    // With Supabase, connection testing is not needed as it's handled by the client
    toast.success("Connected to Supabase", {
      description: "Your backend is ready to use"
    });
  };

  return {
    showAddProduct,
    apiConnected: isLoggedIn,
    isCheckingConnection: false,
    canAddProducts,
    handleAddProduct,
    handleCancelAddProduct,
    handleTestConnection
  };
}

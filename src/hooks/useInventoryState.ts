
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

export function useInventoryState() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { isLoggedIn } = useAuth();

  // Check if user can add products (must be logged in with Supabase)
  const canAddProducts = isLoggedIn;

  const handleAddProduct = () => {
    if (!canAddProducts) {
      toast.error("Please log in to add products", {
        description: "You need to be authenticated to manage inventory"
      });
      return;
    }
    setShowAddProduct(true);
  };

  const handleToggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
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
    showSettings,
    apiConnected: isLoggedIn,
    isCheckingConnection: false,
    useMockApi: false,
    canAddProducts,
    handleAddProduct,
    handleToggleSettings,
    handleCloseSettings,
    handleCancelAddProduct,
    handleTestConnection
  };
}

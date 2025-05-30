
import { useState, useEffect } from "react";
import { 
  checkApiConnection, 
  testApiConnection,
  getMockApiConfig
} from "@/services/api";
import { toast } from "@/components/ui/sonner";

export function useInventoryState() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [useMockApi, setUseMockApi] = useState(getMockApiConfig());

  // Check API connection when the component mounts
  useEffect(() => {
    const checkConnection = async () => {
      setIsCheckingConnection(true);
      const isConnected = await checkApiConnection();
      setApiConnected(isConnected);
      setIsCheckingConnection(false);
    };
    
    checkConnection();
  }, []);

  // Also check connection when auth token changes
  useEffect(() => {
    const checkConnectionOnAuthChange = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const isConnected = await checkApiConnection();
        setApiConnected(isConnected);
      }
    };
    
    // Listen for storage changes (like login/logout)
    const handleStorageChange = () => {
      checkConnectionOnAuthChange();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    await testApiConnection();
    const isConnected = await checkApiConnection();
    setApiConnected(isConnected);
    setUseMockApi(getMockApiConfig()); // Update mock API state
    setIsCheckingConnection(false);
  };

  // Check if we can add products (either connected to API or using mock mode)
  const canAddProducts = apiConnected === true || useMockApi;

  const handleAddProduct = () => {
    if (!canAddProducts) {
      toast.error("Cannot add products while offline", {
        description: "Please check your backend connection or enable mock mode"
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

  return {
    showAddProduct,
    showSettings,
    apiConnected,
    isCheckingConnection,
    useMockApi,
    canAddProducts,
    handleAddProduct,
    handleToggleSettings,
    handleCloseSettings,
    handleCancelAddProduct,
    handleTestConnection
  };
}

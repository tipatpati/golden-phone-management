
import React, { useState, useEffect } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { ApiSettings } from "@/components/inventory/ApiSettings";
import { ConnectionStatus } from "@/components/inventory/ConnectionStatus";
import { Button } from "@/components/ui/button";
import { 
  Barcode, 
  PackageSearch, 
  Settings
} from "lucide-react";
import { 
  checkApiConnection, 
  testApiConnection,
  getMockApiConfig
} from "@/services/api";
import { toast } from "@/components/ui/sonner";

const Inventory = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PackageSearch className="h-8 w-8" />
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Manage your phone products, accessories, and keep track of stock levels.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowSettings(!showSettings)}
          className="flex-shrink-0"
          title="API Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <ApiSettings 
          onClose={() => setShowSettings(false)}
          onConnectionTest={handleTestConnection}
        />
      )}
      
      {/* API Connection Status */}
      <ConnectionStatus 
        canAddProducts={canAddProducts}
        isCheckingConnection={isCheckingConnection}
        onShowSettings={() => setShowSettings(true)}
        onTestConnection={handleTestConnection}
      />
      
      {showAddProduct ? (
        <div className="bg-muted/50 p-4 rounded-lg">
          <AddProductForm onCancel={() => setShowAddProduct(false)} />
        </div>
      ) : (
        <>
          <InventoryTableToolbar onAddProduct={handleAddProduct} />
          <InventoryTable />

          <div className="mt-4 flex items-center justify-center p-4 border border-dashed rounded-lg">
            <div className="flex flex-col items-center text-center max-w-md p-4">
              <Barcode className="h-10 w-10 mb-2 text-muted-foreground" />
              <h3 className="text-lg font-medium">Barcode Scanner Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect a barcode scanner to quickly add or search for products.
                Simply focus on any search field and scan the barcode.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;

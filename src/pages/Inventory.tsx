
import React, { useState, useEffect } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Barcode, PackageSearch, WifiOff, RefreshCw } from "lucide-react";
import { checkApiConnection, testApiConnection } from "@/services/api";
import { toast } from "@/components/ui/sonner";

const Inventory = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

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

  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    await testApiConnection();
    const isConnected = await checkApiConnection();
    setApiConnected(isConnected);
    setIsCheckingConnection(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-8 w-8" />
          Inventory Management
        </h2>
        <p className="text-muted-foreground">
          Manage your phone products, accessories, and keep track of stock levels.
        </p>
      </div>
      
      {/* API Connection Status */}
      {apiConnected === false && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            <div>
              <AlertTitle>Backend Connection Issue</AlertTitle>
              <AlertDescription>
                Unable to connect to the backend server. This will affect adding, updating, and viewing products.
              </AlertDescription>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={handleTestConnection} 
            disabled={isCheckingConnection}
            className="ml-2 flex-shrink-0"
          >
            {isCheckingConnection ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Test Connection
          </Button>
        </Alert>
      )}
      
      {showAddProduct ? (
        <div className="bg-muted/50 p-4 rounded-lg">
          <AddProductForm onCancel={() => setShowAddProduct(false)} />
        </div>
      ) : (
        <>
          <InventoryTableToolbar 
            onAddProduct={() => {
              // Check connection before allowing add product
              if (apiConnected === false) {
                toast.error("Cannot add products while offline", {
                  description: "Please check your backend connection first"
                });
                return;
              }
              setShowAddProduct(true);
            }} 
          />
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

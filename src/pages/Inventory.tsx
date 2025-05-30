
import React, { useState, useEffect } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Barcode, 
  PackageSearch, 
  WifiOff, 
  RefreshCw, 
  Settings,
  X,
  Database,
  Laptop
} from "lucide-react";
import { 
  checkApiConnection, 
  testApiConnection,
  getApiUrl,
  setApiUrl,
  toggleMockApiMode,
  getMockApiConfig
} from "@/services/api";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Inventory = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
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
    setIsCheckingConnection(false);
  };

  const handleSaveSettings = () => {
    console.log('Saving settings - API URL:', apiUrl, 'Mock API:', useMockApi);
    
    // Save the API URL and update the global config
    const savedUrl = setApiUrl(apiUrl);
    toggleMockApiMode(useMockApi);
    
    // Force update the local state to match what was saved
    setApiUrlState(savedUrl);
    
    toast.success('API settings updated', {
      description: useMockApi ? 'Using mock API data' : `API URL set to ${savedUrl}`
    });
    
    // Test the connection with new settings
    handleTestConnection();
    setShowSettings(false);
  };

  // Check if we can add products (either connected to API or using mock mode)
  const canAddProducts = apiConnected === true || useMockApi;

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
        <Card className="border border-muted">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium">API Connection Settings</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pb-2 space-y-4">
            <div>
              <Label htmlFor="api-url" className="text-sm font-medium">Backend API URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input 
                  id="api-url"
                  value={apiUrl} 
                  onChange={(e) => setApiUrlState(e.target.value)}
                  placeholder="https://your-ngrok-url.ngrok-free.app"
                  className="flex-1"
                />
                <Button 
                  onClick={handleTestConnection} 
                  disabled={isCheckingConnection}
                  size="sm"
                >
                  {isCheckingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current URL: {getApiUrl()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="mock-mode"
                checked={useMockApi}
                onCheckedChange={setUseMockApi}
              />
              <Label htmlFor="mock-mode" className="cursor-pointer flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                Use mock data (no backend)
              </Label>
            </div>
            
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <Laptop className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">URL Matching Important</p>
                  <p>
                    Make sure your Django ALLOWED_HOSTS includes the exact same hostname as your API URL above.
                    For ngrok: if your URL is https://abc-123.ngrok-free.app, add "abc-123.ngrok-free.app" to ALLOWED_HOSTS.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-2">
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* API Connection Status */}
      {!canAddProducts && (
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
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => setShowSettings(true)} 
              variant="outline"
              className="ml-2 flex-shrink-0"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
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
          </div>
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
              // Check if we can add products
              if (!canAddProducts) {
                toast.error("Cannot add products while offline", {
                  description: "Please check your backend connection or enable mock mode"
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

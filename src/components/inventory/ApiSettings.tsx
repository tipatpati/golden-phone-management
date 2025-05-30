
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, RefreshCw, Database, Laptop } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  getApiUrl,
  setApiUrl,
  toggleMockApiMode,
  getMockApiConfig,
  testApiConnection 
} from "@/services/api";

interface ApiSettingsProps {
  onClose: () => void;
  onConnectionTest: () => void;
}

export function ApiSettings({ onClose, onConnectionTest }: ApiSettingsProps) {
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [useMockApi, setUseMockApi] = useState(getMockApiConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testApiConnection();
    onConnectionTest();
    setIsTestingConnection(false);
  };

  const handleSaveSettings = () => {
    console.log('Saving settings - API URL:', apiUrl, 'Mock API:', useMockApi);
    
    // Clean and save the API URL
    const cleanUrl = apiUrl.trim().replace(/\/+$/, ''); // Remove trailing slashes
    const savedUrl = setApiUrl(cleanUrl);
    toggleMockApiMode(useMockApi);
    
    // Force update the local state to match what was saved
    setApiUrlState(savedUrl);
    
    toast.success('API settings updated', {
      description: useMockApi ? 'Using mock API data' : `API URL set to ${savedUrl}`
    });
    
    // Test the connection with new settings
    handleTestConnection();
    onClose();
  };

  return (
    <Card className="border border-muted">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">API Connection Settings</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
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
              disabled={isTestingConnection}
              size="sm"
            >
              {isTestingConnection ? (
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
  );
}

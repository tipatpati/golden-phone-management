
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Database, Laptop, ArrowLeft, Settings } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { 
  getApiUrl,
  setApiUrl,
  toggleMockApiMode,
  getMockApiConfig
} from "@/services/config";
import { testApiConnection } from "@/services/connection";

const ApiSettings = () => {
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [useMockApi, setUseMockApi] = useState(getMockApiConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testApiConnection();
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
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              API Settings
            </h1>
            <p className="text-muted-foreground">Configure your Django backend connection</p>
          </div>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your Django backend URL and connection settings. This page is accessible without login.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="api-url" className="text-sm font-medium">Django Backend URL</Label>
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
                Use mock data (no backend required)
              </Label>
            </div>
            
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <Laptop className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Important Notes</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Make sure your Django ALLOWED_HOSTS includes your domain</li>
                    <li>• For ngrok: add the full hostname (e.g., "abc-123.ngrok-free.app")</li>
                    <li>• Enable mock mode if you want to test without a backend</li>
                    <li>• This page is accessible without login to help with connection issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Link to="/">
              <Button variant="outline">
                Back to Login
              </Button>
            </Link>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">Mock Mode</h3>
                  <p className="text-sm text-muted-foreground">Test the app with sample data</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => {
                  setUseMockApi(true);
                  handleSaveSettings();
                }}
              >
                Enable Mock Mode
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-medium">Test Connection</h3>
                  <p className="text-sm text-muted-foreground">Verify backend connectivity</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? 'Testing...' : 'Test Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;

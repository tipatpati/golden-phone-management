
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Database, ArrowLeft, Settings } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { 
  toggleMockApiMode,
  getMockApiConfig
} from "@/services/config";
import { testApiConnection } from "@/services/connection";

const ApiSettings = () => {
  const [useMockApi, setUseMockApi] = useState(getMockApiConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testApiConnection();
    setIsTestingConnection(false);
  };

  const handleSaveSettings = () => {
    console.log('Saving settings - Mock API:', useMockApi);
    
    toggleMockApiMode(useMockApi);
    
    toast.success('API settings updated', {
      description: useMockApi ? 'Using mock API data' : 'Using Supabase backend'
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
            <p className="text-muted-foreground">Configure your backend connection</p>
          </div>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose between mock data for testing or Supabase for real data persistence.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
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
            
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <div className="flex items-start gap-2">
                <Database className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Data Storage Options</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Mock mode: Uses sample data for testing (no persistence)</li>
                    <li>• Supabase mode: Real database with authentication and persistence</li>
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

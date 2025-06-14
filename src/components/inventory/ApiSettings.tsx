
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X, RefreshCw, Database } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { 
  toggleMockApiMode,
  getMockApiConfig
} from "@/services/config";
import { testApiConnection } from "@/services/connection";

interface ApiSettingsProps {
  onClose: () => void;
  onConnectionTest: () => void;
}

export function ApiSettings({ onClose, onConnectionTest }: ApiSettingsProps) {
  const [useMockApi, setUseMockApi] = useState(getMockApiConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    await testApiConnection();
    onConnectionTest();
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
    onClose();
  };

  return (
    <Card className="border border-muted">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">API Settings</CardTitle>
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
              <p className="font-medium mb-1">Data Storage</p>
              <p>
                Mock mode uses sample data for testing. 
                Real mode uses Supabase for data persistence and authentication.
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

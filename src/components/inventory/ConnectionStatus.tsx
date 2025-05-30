
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Settings } from "lucide-react";

interface ConnectionStatusProps {
  canAddProducts: boolean;
  isCheckingConnection: boolean;
  onShowSettings: () => void;
  onTestConnection: () => void;
}

export function ConnectionStatus({ 
  canAddProducts, 
  isCheckingConnection, 
  onShowSettings, 
  onTestConnection 
}: ConnectionStatusProps) {
  if (canAddProducts) return null;

  return (
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
          onClick={onShowSettings} 
          variant="outline"
          className="ml-2 flex-shrink-0"
        >
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
        <Button 
          size="sm" 
          onClick={onTestConnection} 
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
  );
}

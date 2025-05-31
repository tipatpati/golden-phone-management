
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
    <Alert variant="destructive" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <WifiOff className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <AlertTitle className="text-sm sm:text-base">Backend Connection Issue</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            Unable to connect to the backend server. This will affect adding, updating, and viewing products.
          </AlertDescription>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button 
          size="sm" 
          onClick={onShowSettings} 
          variant="outline"
          className="flex-1 sm:flex-none touch-target"
        >
          <Settings className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
        <Button 
          size="sm" 
          onClick={onTestConnection} 
          disabled={isCheckingConnection}
          className="flex-1 sm:flex-none touch-target"
        >
          {isCheckingConnection ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          <span className="hidden sm:inline">Test Connection</span>
        </Button>
      </div>
    </Alert>
  );
}


import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

export function PWAStatus() {
  const { canInstall, isOnline, updateAvailable, promptInstall, reloadApp } = usePWA();

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      toast.success('App installed successfully!');
    } else {
      toast.error('Installation was cancelled or failed');
    }
  };

  const handleUpdate = () => {
    toast.success('Updating app...', {
      description: 'The app will reload with the latest version'
    });
    setTimeout(reloadApp, 1000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Offline Status */}
      {!isOnline && (
        <Alert className="w-auto bg-orange-50 border-orange-200">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You're offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}

      {/* Online Status Badge */}
      {isOnline && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Alert className="w-auto bg-blue-50 border-blue-200">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center gap-2 text-blue-800">
            New version available
            <Button size="sm" onClick={handleUpdate} className="h-6 px-2 text-xs">
              Update
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Install Prompt */}
      {canInstall && (
        <Alert className="w-auto bg-purple-50 border-purple-200">
          <Download className="h-4 w-4 text-purple-600" />
          <AlertDescription className="flex items-center gap-2 text-purple-800">
            Install this app for better experience
            <Button size="sm" onClick={handleInstall} className="h-6 px-2 text-xs">
              Install
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

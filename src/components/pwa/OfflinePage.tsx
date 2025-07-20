
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

export function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Logo size={80} />
          </div>
          <div className="flex justify-center">
            <div className="rounded-full bg-orange-100 p-3">
              <WifiOff className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            You're Offline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              It looks like you've lost your internet connection. Some features may not be available.
            </p>
            <p className="text-sm text-gray-500">
              Check your connection and try again, or continue with cached data.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full" size="lg">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <div className="text-xs text-gray-400 border-t pt-4">
            GOLDEN PHONE - Working offline
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

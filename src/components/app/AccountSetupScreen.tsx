import React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AccountSetupScreenProps {
  variant?: "loading" | "error" | "noProfile";
}

export function AccountSetupScreen({ variant = "loading" }: AccountSetupScreenProps) {
  const { logout, checkAuthStatus } = useAuth();

  const handleRetry = () => {
    checkAuthStatus();
  };

  const handleSignOut = () => {
    logout();
  };

  if (variant === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <LoadingSpinner size="lg" />
            </div>
            <CardTitle>Setting up your account</CardTitle>
            <CardDescription>
              Please wait while we prepare your workspace...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (variant === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Account Setup Error</CardTitle>
            <CardDescription>
              We encountered an issue setting up your account. This might be temporary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRetry} className="w-full" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleSignOut} className="w-full" variant="ghost">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "noProfile") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Account Not Found</CardTitle>
            <CardDescription>
              Your account profile needs to be set up by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Please contact your system administrator to complete your account setup.
            </div>
            <Button onClick={handleSignOut} className="w-full" variant="outline">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
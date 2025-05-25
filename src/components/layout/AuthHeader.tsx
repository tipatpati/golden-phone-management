
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

export function AuthHeader() {
  const { isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        Logged in
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={logout}
        className="flex items-center gap-1"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}

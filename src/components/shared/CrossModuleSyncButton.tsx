import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";
import { toast } from "@/components/ui/sonner";

interface CrossModuleSyncButtonProps {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  source: "inventory" | "supplier";
}

export function CrossModuleSyncButton({ 
  size = "sm", 
  variant = "outline",
  source 
}: CrossModuleSyncButtonProps) {
  
  const handleSync = async () => {
    try {
      console.log(`🔄 Requesting sync from ${source} module`);
      
      // Request immediate synchronization
      await UnifiedProductCoordinator.requestSync();
      
      toast.success("Sync requested - data will refresh automatically");
    } catch (error) {
      console.error("Failed to request sync:", error);
      toast.error("Failed to request sync");
    }
  };

  return (
    <Button
      onClick={handleSync}
      size={size}
      variant={variant}
      className="flex items-center gap-2"
      title="Sync data between inventory and supplier modules"
    >
      <RefreshCw className="h-4 w-4" />
      Sync
    </Button>
  );
}
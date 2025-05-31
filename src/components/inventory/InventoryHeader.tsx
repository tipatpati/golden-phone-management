
import React from "react";
import { Button } from "@/components/ui/button";
import { PackageSearch, Settings } from "lucide-react";

interface InventoryHeaderProps {
  onToggleSettings: () => void;
}

export function InventoryHeader({ onToggleSettings }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
          <span className="truncate">Inventory Management</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          Manage your phone products, accessories, and keep track of stock levels.
        </p>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onToggleSettings}
        className="flex-shrink-0 touch-target"
        title="API Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

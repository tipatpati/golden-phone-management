
import React from "react";
import { Button } from "@/components/ui/button";
import { PackageSearch, Settings } from "lucide-react";

interface InventoryHeaderProps {
  onToggleSettings: () => void;
}

export function InventoryHeader({ onToggleSettings }: InventoryHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-8 w-8" />
          Inventory Management
        </h2>
        <p className="text-muted-foreground">
          Manage your phone products, accessories, and keep track of stock levels.
        </p>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onToggleSettings}
        className="flex-shrink-0"
        title="API Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

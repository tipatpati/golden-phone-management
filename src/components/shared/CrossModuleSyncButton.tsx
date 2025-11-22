import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";
import { SupplierInventoryIntegrationService } from "@/services/suppliers/SupplierInventoryIntegrationService";
import { ExchangeInventoryReconciliation } from "@/services/sales/exchanges/ExchangeInventoryReconciliation";
import { toast } from "@/components/ui/sonner";

interface CrossModuleSyncButtonProps {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  source: "inventory" | "supplier" | "exchange";
}

export function CrossModuleSyncButton({ 
  size = "sm", 
  variant = "outline",
  source 
}: CrossModuleSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log(`🔄 Requesting sync from ${source} module`);
      
      if (source === 'supplier') {
        // For supplier module, sync transactions to inventory
        await SupplierInventoryIntegrationService.syncAllCompletedTransactions();
        toast.success("Supplier transactions synced to inventory");
      } else if (source === 'exchange') {
        // For exchange module, reconcile with inventory
        const result = await ExchangeInventoryReconciliation.reconcile();
        if (result.success) {
          if (result.missingInInventory.length > 0) {
            toast.warning(`Found ${result.missingInInventory.length} missing items in inventory`);
          } else {
            toast.success("Exchange-inventory sync verified - all consistent");
          }
        }
      } else {
        // Request immediate synchronization
        await UnifiedProductCoordinator.requestSync();
        toast.success("Sync requested - data will refresh automatically");
      }
    } catch (error) {
      console.error("Failed to request sync:", error);
      toast.error("Failed to request sync");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      size={size}
      variant={variant}
      className="flex items-center gap-2"
      title="Sync data between modules and verify consistency"
      disabled={isSyncing}
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync'}
    </Button>
  );
}
import React from "react";
import { ProductImportDialog } from "./ProductImportDialog";
import { ProductExportDialog } from "./ProductExportDialog";
import { BulkBarcodeGenerator } from "./BulkBarcodeGenerator";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { PageHeader } from "@/components/common/PageHeader";

export function InventoryHeader() {
  const { data: currentRole } = useCurrentUserRole();
  
  // Check if user can modify products using permission-based check
  const canModifyProducts = currentRole && roleUtils.hasPermission(currentRole, 'inventory');

  return (
    <PageHeader
      title="Gestione Inventario"
      subtitle={
        canModifyProducts 
          ? "Gestisci i tuoi prodotti, accessori e tieni traccia dei livelli di scorte."
          : "Visualizza i prodotti e accessori disponibili."
      }
      actions={
        canModifyProducts && (
          <div className="flex gap-2">
            <BulkBarcodeGenerator />
            <ProductExportDialog />
            <ProductImportDialog />
          </div>
        )
      }
    />
  );
}
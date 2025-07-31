
import React from "react";
import { PackageSearch } from "lucide-react";
import { ProductImportDialog } from "./ProductImportDialog";
import { ProductExportDialog } from "./ProductExportDialog";
import { BulkBarcodeGenerator } from "./BulkBarcodeGenerator";
import { useAuth } from "@/contexts/AuthContext";

export function InventoryHeader() {
  const { userRole } = useAuth();
  
  // Check if user can modify products
  const canModifyProducts = userRole && ['inventory_manager', 'manager', 'admin', 'super_admin'].includes(userRole);

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6 w-full md-enter-refined md-stagger-container">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 mb-2 md-motion-smooth">
          <PackageSearch className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0 text-primary md-motion-smooth" />
          <span className="truncate">Gestione Inventario</span>
        </h2>
        <p className="text-muted-foreground text-sm lg:text-base">
          {canModifyProducts 
            ? "Gestisci i tuoi prodotti, accessori e tieni traccia dei livelli di scorte."
            : "Visualizza i prodotti e accessori disponibili."
          }
        </p>
      </div>
      
      {canModifyProducts && (
        <div className="flex gap-2 sm:gap-3 md-stagger-container">
          <BulkBarcodeGenerator />
          <ProductExportDialog />
          <ProductImportDialog />
        </div>
      )}
    </div>
  );
}

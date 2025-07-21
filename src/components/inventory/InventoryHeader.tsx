
import React from "react";
import { PackageSearch } from "lucide-react";
import { ProductImportDialog } from "./ProductImportDialog";
import { ProductExportDialog } from "./ProductExportDialog";

export function InventoryHeader() {

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-6 w-full">
      <div className="flex-1 min-w-0">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
          <PackageSearch className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0 text-primary" />
          <span className="truncate">Gestione Inventario</span>
        </h2>
        <p className="text-muted-foreground text-sm lg:text-base">
          Gestisci i tuoi prodotti, accessori e tieni traccia dei livelli di scorte.
        </p>
      </div>
      
      <div className="flex gap-2 sm:gap-3">
        <ProductExportDialog />
        <ProductImportDialog />
      </div>
    </div>
  );
}

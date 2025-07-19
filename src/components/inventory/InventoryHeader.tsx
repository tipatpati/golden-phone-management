
import React from "react";
import { Button } from "@/components/ui/button";
import { PackageSearch, Settings } from "lucide-react";

export function InventoryHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 w-full">
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackageSearch className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 flex-shrink-0" />
          <span className="truncate">Gestione Inventario</span>
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">
          Gestisci i tuoi prodotti, accessori e tieni traccia dei livelli di scorte.
        </p>
      </div>
    </div>
  );
}

import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Receipt, X } from "lucide-react";
import { EnhancedEmptyState } from "@/components/common/EnhancedEmptyState";
import { NewSaleDialog } from "./NewSaleDialog";

interface EmptySalesListProps {
  searchTerm: string;
  onClearSearch?: () => void;
}

export function EmptySalesList({ searchTerm, onClearSearch }: EmptySalesListProps) {
  if (searchTerm) {
    // Search results empty state
    return (
      <Card variant="outlined" className="glass-card border-glow">
        <CardContent className="p-6 sm:p-12">
          <EnhancedEmptyState
            icon={Receipt}
            title="Nessuna vendita trovata"
            description={`Nessun risultato per "${searchTerm}". Prova con un termine diverso o cancella la ricerca.`}
            primaryAction={
              onClearSearch
                ? {
                    label: 'Cancella ricerca',
                    onClick: onClearSearch,
                    icon: X,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  // No sales at all empty state - show the NewSaleDialog with its built-in trigger
  return (
    <Card variant="outlined" className="glass-card border-glow">
      <CardContent className="p-6 sm:p-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
            <Receipt className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Nessuna vendita ancora
            </h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Inizia creando la tua prima vendita. Aggiungi prodotti, seleziona un cliente e completa la transazione.
            </p>
          </div>
          <div className="pt-2">
            {/* NewSaleDialog has its own trigger button */}
            <NewSaleDialog />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

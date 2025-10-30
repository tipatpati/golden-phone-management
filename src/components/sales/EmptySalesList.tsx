import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Receipt, Plus, X } from "lucide-react";
import { EnhancedEmptyState } from "@/components/common/EnhancedEmptyState";
import { NewSaleDialog } from "./NewSaleDialog";

interface EmptySalesListProps {
  searchTerm: string;
  onClearSearch?: () => void;
  onNewSale?: () => void;
}

export function EmptySalesList({ searchTerm, onClearSearch, onNewSale }: EmptySalesListProps) {
  const [showNewSaleDialog, setShowNewSaleDialog] = React.useState(false);

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
            secondaryAction={
              onNewSale
                ? {
                    label: 'Nuova vendita',
                    onClick: onNewSale,
                    variant: 'outline',
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  // No sales at all empty state
  return (
    <Card variant="outlined" className="glass-card border-glow">
      <CardContent className="p-6 sm:p-12">
        <EnhancedEmptyState
          icon={Receipt}
          title="Nessuna vendita ancora"
          description="Inizia creando la tua prima vendita. Aggiungi prodotti, seleziona un cliente e completa la transazione."
          primaryAction={{
            label: 'Crea Nuova Vendita',
            onClick: () => setShowNewSaleDialog(true),
            icon: Plus,
          }}
        />

        {/* NewSaleDialog */}
        {showNewSaleDialog && (
          <NewSaleDialog />
        )}
      </CardContent>
    </Card>
  );
}
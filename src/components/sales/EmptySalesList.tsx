import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Receipt } from "lucide-react";
import { NewSaleDialog } from "./NewSaleDialog";

interface EmptySalesListProps {
  searchTerm: string;
}

export function EmptySalesList({ searchTerm }: EmptySalesListProps) {
  return (
    <Card variant="outlined" className="glass-card border-glow">
      <CardContent className="p-12">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 ring-1 ring-primary/20 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-on-surface">
              {searchTerm ? "Nessuna garentille trovata" : "Nessuna garentille ancora"}
            </h3>
            <p className="text-on-surface-variant text-base max-w-md mx-auto">
              {searchTerm 
                ? "Prova a modificare i criteri di ricerca o cancella la ricerca per vedere tutte le garentille." 
                : "Inizia creando la tua prima transazione di garentille."
              }
            </p>
          </div>
          {!searchTerm && (
            <NewSaleDialog />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
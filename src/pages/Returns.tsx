import React, { useState } from "react";
import { PageLayout } from "@/components/common/PageLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FileText } from "lucide-react";
import { useReturns } from "@/services/sales/returns/ReturnReactQueryService";
import { ReturnsList } from "@/components/sales/returns/ReturnsList";
import { ReturnsStats } from "@/components/sales/returns/ReturnsStats";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Returns = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: returns = [], isLoading, error } = useReturns();

  // Filter returns based on search
  const filteredReturns = React.useMemo(() => {
    if (!searchTerm.trim()) return returns;
    
    const term = searchTerm.toLowerCase();
    return returns.filter(returnRecord => {
      const returnNumber = returnRecord.return_number?.toLowerCase() || '';
      const saleNumber = returnRecord.sale?.sale_number?.toLowerCase() || '';
      const clientName = returnRecord.sale?.client
        ? returnRecord.sale.client.type === 'business'
          ? returnRecord.sale.client.company_name?.toLowerCase() || ''
          : `${returnRecord.sale.client.first_name} ${returnRecord.sale.client.last_name}`.toLowerCase()
        : '';
      
      return (
        returnNumber.includes(term) ||
        saleNumber.includes(term) ||
        clientName.includes(term)
      );
    });
  }, [returns, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold">Errore nel caricamento</h3>
              <p className="text-sm text-muted-foreground">
                Impossibile caricare i resi. Riprova più tardi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Gestione Resi
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualizza e gestisci tutti i resi dei prodotti
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <ReturnsStats returns={returns} />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Cerca per numero reso, vendita o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
            >
              Cancella
            </Button>
          )}
        </div>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nessun reso trovato" : "Nessun reso presente"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchTerm
                ? "Prova a modificare i termini di ricerca"
                : "I resi elaborati appariranno qui"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReturnsList returns={filteredReturns} searchTerm={searchTerm} />
      )}
    </PageLayout>
  );
};

export default Returns;

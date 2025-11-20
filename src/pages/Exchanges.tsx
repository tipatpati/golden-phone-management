import React, { useState } from "react";
import { PageLayout } from "@/components/common/PageLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import { useExchanges } from "@/services/sales/exchanges/ExchangeReactQueryService";
import { ExchangesList } from "@/components/sales/exchanges/ExchangesList";
import { ExchangesStats } from "@/components/sales/exchanges/ExchangesStats";
import { ExchangesHeader } from "@/components/sales/exchanges/ExchangesHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Exchanges = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: exchanges = [], isLoading, error } = useExchanges();

  // Filter exchanges based on search
  const filteredExchanges = React.useMemo(() => {
    if (!searchTerm.trim()) return exchanges;
    
    const term = searchTerm.toLowerCase();
    return exchanges.filter(exchange => {
      const exchangeNumber = exchange.exchange_number?.toLowerCase() || '';
      const clientName = exchange.client
        ? exchange.client.type === 'business'
          ? exchange.client.company_name?.toLowerCase() || ''
          : `${exchange.client.first_name} ${exchange.client.last_name}`.toLowerCase()
        : '';
      
      // Search in trade-in items
      const tradeInMatch = exchange.trade_in_items?.some(item => 
        `${item.brand} ${item.model}`.toLowerCase().includes(term) ||
        item.serial_number?.toLowerCase().includes(term)
      );
      
      return (
        exchangeNumber.includes(term) ||
        clientName.includes(term) ||
        tradeInMatch
      );
    });
  }, [exchanges, searchTerm]);

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
                Impossibile caricare i cambi. Riprova più tardi.
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
      <div className="mb-6">
        <ExchangesHeader />
      </div>

      {/* Stats */}
      <div className="mb-6">
        <ExchangesStats exchanges={exchanges} />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Cerca per numero cambio, cliente o prodotti..."
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

      {/* Exchanges List */}
      {filteredExchanges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nessun cambio trovato" : "Nessun cambio presente"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {searchTerm
                ? "Prova a modificare i termini di ricerca"
                : "I cambi elaborati appariranno qui"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ExchangesList exchanges={filteredExchanges} searchTerm={searchTerm} />
      )}
    </PageLayout>
  );
};

export default Exchanges;

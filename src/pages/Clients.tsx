import React, { useState } from "react";
import { useClients, type Client } from "@/services";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsSearchBar } from "@/components/clients/ClientsSearchBar";
import { ClientsStats } from "@/components/clients/ClientsStats";
import { ClientsList } from "@/components/clients/ClientsList";
import { EmptyClientsList } from "@/components/clients/EmptyClientsList";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { PageLayout } from "@/components/common/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Clients = () => {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  
  const { data: clientsData = [], isLoading, error } = useClients(activeSearchQuery);

  // Ensure clientsData is always an array and properly typed
  const clients: Client[] = Array.isArray(clientsData) ? clientsData.map(client => ({
    ...client,
    type: client.type as 'individual' | 'business',
    status: client.status as 'active' | 'inactive'
  })) : [];

  const handleSearch = () => {
    setActiveSearchQuery(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setActiveSearchQuery('');
  };

  if (isLoading) {
    return (
      <PageLayout>
        <ClientsHeader />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <ClientsHeader />
        <p className="text-destructive">Errore nel caricamento clienti. Riprova.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ClientsHeader />
      <ModuleNavCards currentModule="clients" />

      <div className="space-y-4">
        <ClientsSearchBar 
          searchQuery={localSearchQuery}
          onSearchChange={setLocalSearchQuery}
          onSearch={handleSearch}
          onClear={handleClearSearch}
        />

        {activeSearchQuery && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {clients.length > 0 
                ? `Trovati ${clients.length} cliente/i per "${activeSearchQuery}"`
                : `Nessun cliente trovato per "${activeSearchQuery}"`
              }
            </AlertDescription>
          </Alert>
        )}

        <ClientsStats clients={clients} />
      </div>

      {clients.length === 0 ? (
        <EmptyClientsList searchTerm={activeSearchQuery} />
      ) : (
        <ClientsList clients={clients} />
      )}
    </PageLayout>
  );
};

export default Clients;

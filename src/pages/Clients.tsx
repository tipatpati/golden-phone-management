
import React, { useState } from "react";
import { useClients, type Client } from "@/services";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsSearchBar } from "@/components/clients/ClientsSearchBar";
import { ClientsStats } from "@/components/clients/ClientsStats";
import { ClientsList } from "@/components/clients/ClientsList";
import { EmptyClientsList } from "@/components/clients/EmptyClientsList";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { PageLayout } from "@/components/common/PageLayout";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clientsData = [], isLoading, error } = useClients(searchTerm);

  // Ensure clientsData is always an array and properly typed
  const clients: Client[] = Array.isArray(clientsData) ? clientsData.map(client => ({
    ...client,
    type: client.type as 'individual' | 'business',
    status: client.status as 'active' | 'inactive'
  })) : [];

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <ClientsSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <div className="lg:col-span-2">
            <ClientsStats clients={clients} />
          </div>
        </div>

      {clients.length === 0 ? (
        <EmptyClientsList searchTerm={searchTerm} />
      ) : (
        <ClientsList clients={clients} />
      )}
    </PageLayout>
  );
};

export default Clients;

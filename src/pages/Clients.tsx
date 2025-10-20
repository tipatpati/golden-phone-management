import React, { useState } from "react";
import { useClients, useDeleteClient, type Client } from "@/services";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsSearchBar } from "@/components/clients/ClientsSearchBar";
import { ClientsStats } from "@/components/clients/ClientsStats";
import { ClientsList } from "@/components/clients/ClientsList";
import { EmptyClientsList } from "@/components/clients/EmptyClientsList";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { PageLayout } from "@/components/common/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { Info } from "lucide-react";

const Clients = () => {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const { data: clientsData = [], isLoading, error } = useClients(activeSearchQuery);
  const deleteClient = useDeleteClient();

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

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  const handleDelete = async (client: Client) => {
    try {
      await deleteClient.mutateAsync(client.id);
      const clientName = client.type === "business" 
        ? client.company_name 
        : `${client.first_name} ${client.last_name}`;
      toast.success(`Cliente "${clientName}" eliminato con successo!`);
    } catch (error: any) {
      toast.error(`Errore nell'eliminazione del cliente: ${error.message}`);
    }
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
        <ClientsList 
          clients={clients} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Client Dialog */}
      {editingClient && (
        <EditClientDialog 
          client={editingClient} 
          open={true}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}
    </PageLayout>
  );
};

export default Clients;

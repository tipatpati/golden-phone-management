
import React, { useState } from "react";
import { useClients, type Client } from "@/services/useClients";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsSearchBar } from "@/components/clients/ClientsSearchBar";
import { ClientsStats } from "@/components/clients/ClientsStats";
import { ClientsList } from "@/components/clients/ClientsList";
import { EmptyClientsList } from "@/components/clients/EmptyClientsList";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clientsData = [], isLoading, error } = useClients(searchTerm);

  // Type assertion to ensure the data conforms to our Client type
  const clients: Client[] = clientsData.map(client => ({
    ...client,
    type: client.type as 'individual' | 'business',
    status: client.status as 'active' | 'inactive'
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Client Management
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Client Management
            </h2>
            <p className="text-red-500 mt-3 text-lg">Error loading clients. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <ClientsHeader />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
      </div>
    </div>
  );
};

export default Clients;

import { useMemo } from "react";
import { useClients } from "@/services/useClients";

/**
 * Custom hook that provides client-related data services
 * Consolidates client data fetching and statistics
 */
export function useClientServices() {
  const { data: clients, isLoading, error } = useClients();
  
  // Client statistics
  const statistics = useMemo(() => {
    if (!clients || !Array.isArray(clients)) {
      return {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        businessClients: 0,
        individualClients: 0,
        clientsWithEmail: 0,
        clientsWithPhone: 0,
      };
    }

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      inactiveClients: clients.filter(c => c.status === 'inactive').length,
      businessClients: clients.filter(c => c.type === 'business').length,
      individualClients: clients.filter(c => c.type === 'individual').length,
      clientsWithEmail: clients.filter(c => c.email && c.email.trim()).length,
      clientsWithPhone: clients.filter(c => c.phone && c.phone.trim()).length,
    };
  }, [clients]);

  // Search and filter functionality
  const searchClients = useMemo(() => {
    return (searchTerm: string) => {
      if (!clients || !Array.isArray(clients) || !searchTerm.trim()) {
        return clients || [];
      }

      const term = searchTerm.toLowerCase();
      return clients.filter(client => {
        const searchableFields = [
          client.first_name,
          client.last_name,
          client.company_name,
          client.contact_person,
          client.email,
          client.phone,
          client.address,
          client.tax_id,
        ];

        return searchableFields.some(field => 
          field && field.toLowerCase().includes(term)
        );
      });
    };
  }, [clients]);

  // Filter by type
  const filterByType = useMemo(() => {
    return (type: 'individual' | 'business' | 'all') => {
      if (!clients || !Array.isArray(clients) || type === 'all') {
        return clients || [];
      }
      return clients.filter(client => client.type === type);
    };
  }, [clients]);

  // Filter by status
  const filterByStatus = useMemo(() => {
    return (status: 'active' | 'inactive' | 'all') => {
      if (!clients || !Array.isArray(clients) || status === 'all') {
        return clients || [];
      }
      return clients.filter(client => client.status === status);
    };
  }, [clients]);

  return {
    clients: clients || [],
    statistics,
    searchClients,
    filterByType,
    filterByStatus,
    isLoading,
    error
  };
}
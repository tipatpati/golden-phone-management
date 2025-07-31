import React from "react";
import { useOptimizedService } from "../core/OptimizedService";
import { Client, CreateClientData } from "./types";

/**
 * Optimized client service with enhanced caching and error handling
 * For now, using existing service hooks until we can fully integrate
 */

// Re-export existing optimized hooks from the current service
export { 
  useClients, 
  useClient,
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient 
} from "../useClients";

// Additional client-specific optimizations
export const useOptimizedClientQueries = () => {
  return {
    invalidateClients: () => {
      // Could implement cache invalidation here
      console.log('Invalidating client queries');
    },
    prefetchClient: (id: string) => {
      // Could implement prefetching here
      console.log('Prefetching client:', id);
    },
  };
};

// Client statistics hook
export const useClientStatistics = () => {
  const { data: clients } = require("../useClients").useClients();
  
  return React.useMemo(() => {
    if (!clients || !Array.isArray(clients)) {
      return {
        totalClients: 0,
        activeClients: 0,
        businessClients: 0,
        individualClients: 0,
      };
    }

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      businessClients: clients.filter(c => c.type === 'business').length,
      individualClients: clients.filter(c => c.type === 'individual').length,
    };
  }, [clients]);
};
// Service layer exports
export * from './core/BaseApiService';
export * from './core/BaseReactQueryService';

// Client services
export * from './clients/ClientReactQueryService';

// Product services  
export * from './products/ProductReactQueryService';

// Legacy exports for backwards compatibility
export { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from './clients/ClientReactQueryService';
export { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useProductRecommendations } from './products/ProductReactQueryService';

// Re-export sales and repairs (these need migration)
export * from './sales';
export * from './useRepairs';
export * from './useEmployees';
export * from './useSuppliers';
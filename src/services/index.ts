// Service layer exports
export * from './core/BaseApiService';
export * from './core/BaseReactQueryService';
export * from './core/ServiceRegistry';

// Client services
export * from './clients/ClientReactQueryService';

// Inventory services  
export * from './inventory/InventoryReactQueryService';

// Sales services
export * from './sales/SalesReactQueryService';

// Repairs services
export * from './repairs/RepairsReactQueryService';

// Suppliers services
export * from './suppliers/SuppliersReactQueryService';

// Employees services
export * from './employees/EmployeesReactQueryService';

// Legacy exports for backwards compatibility
export { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from './clients/ClientReactQueryService';
export { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useProductRecommendations } from './inventory/InventoryReactQueryService';
export { useSales, useSale, useCreateSale, useUpdateSale, useDeleteSale } from './sales/SalesReactQueryService';
export { useRepairs, useRepair, useCreateRepair, useUpdateRepair, useDeleteRepair, useTechnicians } from './repairs/RepairsReactQueryService';
export { useSuppliers, useSupplier, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from './suppliers/SuppliersReactQueryService';
export { useEmployees, useEmployee, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from './employees/EmployeesReactQueryService';
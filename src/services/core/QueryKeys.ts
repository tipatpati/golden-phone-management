/**
 * CENTRALIZED QUERY KEYS
 * Single source of truth for all React Query cache keys
 * Ensures consistency and prevents cache invalidation issues
 */

export const QUERY_KEYS = {
  // Inventory
  inventory: {
    all: ['inventory'] as const,
    products: () => [...QUERY_KEYS.inventory.all, 'products'] as const,
    product: (id: string) => [...QUERY_KEYS.inventory.products(), id] as const,
    productUnits: (productId?: string) => 
      productId 
        ? [...QUERY_KEYS.inventory.all, 'units', productId] as const
        : [...QUERY_KEYS.inventory.all, 'units'] as const,
    unit: (unitId: string) => [...QUERY_KEYS.inventory.all, 'unit', unitId] as const,
  },
  
  // Suppliers
  suppliers: {
    all: ['suppliers'] as const,
    list: () => [...QUERY_KEYS.suppliers.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.suppliers.all, id] as const,
    active: () => [...QUERY_KEYS.suppliers.all, 'active'] as const,
    transactions: {
      all: ['supplier-transactions'] as const,
      list: () => [...QUERY_KEYS.suppliers.transactions.all, 'list'] as const,
      detail: (id: string) => [...QUERY_KEYS.suppliers.transactions.all, id] as const,
      items: (transactionId: string) => [...QUERY_KEYS.suppliers.transactions.all, 'items', transactionId] as const,
    }
  },
  
  // Clients
  clients: {
    all: ['clients'] as const,
    list: () => [...QUERY_KEYS.clients.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.clients.all, id] as const,
    active: () => [...QUERY_KEYS.clients.all, 'active'] as const,
  },
  
  // Sales
  sales: {
    all: ['sales'] as const,
    list: () => [...QUERY_KEYS.sales.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.sales.all, id] as const,
    items: (saleId: string) => [...QUERY_KEYS.sales.all, 'items', saleId] as const,
    returns: {
      all: ['sale-returns'] as const,
      list: () => [...QUERY_KEYS.sales.returns.all, 'list'] as const,
      detail: (id: string) => [...QUERY_KEYS.sales.returns.all, id] as const,
    }
  },
  
  // Repairs
  repairs: {
    all: ['repairs'] as const,
    list: () => [...QUERY_KEYS.repairs.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.repairs.all, id] as const,
    parts: (repairId: string) => [...QUERY_KEYS.repairs.all, 'parts', repairId] as const,
  },
  
  // Employees
  employees: {
    all: ['employees'] as const,
    list: () => [...QUERY_KEYS.employees.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.employees.all, id] as const,
    profiles: {
      all: ['employee-profiles'] as const,
      detail: (id: string) => [...QUERY_KEYS.employees.profiles.all, id] as const,
    }
  },
  
  // Brands & Models
  brands: {
    all: ['brands'] as const,
    list: () => [...QUERY_KEYS.brands.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.brands.all, id] as const,
    byCategory: (categoryId: number) => [...QUERY_KEYS.brands.all, 'category', String(categoryId)] as const,
    search: (term: string) => [...QUERY_KEYS.brands.all, 'search', term] as const,
  },
  
  models: {
    all: ['models'] as const,
    list: () => [...QUERY_KEYS.models.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.models.all, id] as const,
    byBrand: (brandName: string) => [...QUERY_KEYS.models.all, 'brand', brandName] as const,
    byCategory: (categoryId: number) => [...QUERY_KEYS.models.all, 'category', String(categoryId)] as const,
    search: (term: string, brandName?: string) => 
      [...QUERY_KEYS.models.all, 'search', term, brandName || ''] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    list: () => [...QUERY_KEYS.categories.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.categories.all, id] as const,
  },
  
  // Stores
  stores: {
    all: ['stores'] as const,
    list: () => [...QUERY_KEYS.stores.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.stores.all, id] as const,
    userStores: (userId: string) => [...QUERY_KEYS.stores.all, 'user', userId] as const,
  },
  
  // Shared/System
  technicians: ['technicians'] as const,
  profiles: ['profiles'] as const,
  barcode: (entityId: string) => ['barcode', entityId] as const,
} as const;

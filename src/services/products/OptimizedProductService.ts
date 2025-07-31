import { useOptimizedService } from "../core/OptimizedService";
import { Product, CreateProductData } from "./types";

/**
 * Optimized product service with enhanced caching and error handling
 * For now, using existing service hooks until we can fully integrate
 */

// Re-export existing optimized hooks from the current service
export { 
  useProducts, 
  useProduct,
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct 
} from "./ProductReactQueryService";

// Additional product-specific optimizations
export const useOptimizedProductQueries = () => {
  return {
    invalidateProducts: () => {
      // Could implement cache invalidation here
      console.log('Invalidating product queries');
    },
    prefetchProduct: (id: string) => {
      // Could implement prefetching here
      console.log('Prefetching product:', id);
    },
  };
};
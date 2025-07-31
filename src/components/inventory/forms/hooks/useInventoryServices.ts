import { useMemo } from "react";
import { useSearchBrands, useModelsByBrand } from "@/services/brands/BrandsReactQueryService";
import { useProducts } from "@/services/products/ProductReactQueryService";

/**
 * Custom hook that provides inventory-related data services
 * Consolidates brand, model, and product data fetching
 */
export function useInventoryServices(brandFilter?: string) {
  // Get brands and models from dedicated database
  const { data: searchedBrands = [] } = useSearchBrands(brandFilter || '');
  const { data: modelsByBrand = [] } = useModelsByBrand(brandFilter || '');
  const { data: products } = useProducts();
  
  // Convert to suggestion arrays
  const brandSuggestions = useMemo(() => 
    searchedBrands.map(b => b.name), 
    [searchedBrands]
  );
  
  const modelSuggestions = useMemo(() => 
    modelsByBrand.map(m => m.name), 
    [modelsByBrand]
  );

  // Get unique brands and models from products for autocomplete
  const uniqueBrands = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const brands = new Set(
      products
        .map(p => p.brand)
        .filter(Boolean)
        .map(brand => brand.replace(/\s*\([^)]*\)/, '').trim()) // Remove color info
    );
    return Array.from(brands) as string[];
  }, [products]);

  const uniqueModels = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const models = new Set(products.map(p => p.model).filter(Boolean));
    return Array.from(models) as string[];
  }, [products]);

  return {
    brandSuggestions,
    modelSuggestions,
    uniqueBrands,
    uniqueModels,
    products,
    isLoading: false // Could track loading states here
  };
}
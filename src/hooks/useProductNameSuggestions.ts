import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseProductNameSuggestionsReturn {
  brandSuggestions: string[];
  modelSuggestions: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get brand and model suggestions from existing products
 * No separate database needed - extracts from existing product data
 */
export function useProductNameSuggestions(selectedBrand?: string): UseProductNameSuggestionsReturn {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unique brands and models from products table
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get all products with brand and model
        const { data, error: queryError } = await supabase
          .from('products')
          .select('brand, model')
          .not('brand', 'is', null)
          .not('model', 'is', null);

        if (queryError) throw queryError;

        if (data) {
          // Extract unique brands
          const uniqueBrands = Array.from(
            new Set(data.map(p => p.brand).filter(Boolean))
          ).sort();

          // Extract unique models
          const uniqueModels = Array.from(
            new Set(data.map(p => p.model).filter(Boolean))
          ).sort();

          setBrands(uniqueBrands);
          setModels(uniqueModels);
        }
      } catch (err) {
        console.error('Failed to fetch product name suggestions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  // Filter models by selected brand if provided
  const filteredModels = useMemo(() => {
    if (!selectedBrand) return models;

    // Re-fetch to get models specific to the brand
    // For now, return all models (could optimize with a separate query)
    return models;
  }, [models, selectedBrand]);

  return {
    brandSuggestions: brands,
    modelSuggestions: filteredModels,
    isLoading,
    error
  };
}

/**
 * Hook to get brand suggestions only
 */
export function useBrandSuggestions() {
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);

      const { data } = await supabase
        .from('products')
        .select('brand')
        .not('brand', 'is', null);

      if (data) {
        const unique = Array.from(new Set(data.map(p => p.brand))).sort();
        setBrands(unique);
      }

      setIsLoading(false);
    };

    fetchBrands();
  }, []);

  return { brandSuggestions: brands, isLoading };
}

/**
 * Hook to get model suggestions for a specific brand and optionally category
 * @param brand - Brand name to filter models
 * @param categoryId - Optional category ID to further filter models
 */
export function useModelSuggestions(brand?: string, categoryId?: number) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!brand) {
      setModels([]);
      return;
    }

    const fetchModels = async () => {
      setIsLoading(true);

      // Build query with brand filter
      let query = supabase
        .from('products')
        .select('model, category_id')
        .eq('brand', brand)
        .not('model', 'is', null);

      // Add category filter if provided
      if (categoryId !== undefined) {
        query = query.eq('category_id', categoryId);
      }

      const { data } = await query;

      if (data) {
        const unique = Array.from(new Set(data.map(p => p.model))).sort();
        setModels(unique);
      }

      setIsLoading(false);
    };

    fetchModels();
  }, [brand, categoryId]);

  return { modelSuggestions: models, isLoading };
}

/**
 * Extended hook with common device brands as fallback
 * Combines existing product brands with common brands
 */
export function useEnhancedBrandSuggestions() {
  const { brandSuggestions, isLoading } = useBrandSuggestions();

  // Common device brands as fallback/enhancement
  const commonBrands = [
    'Apple',
    'Samsung',
    'Google',
    'OnePlus',
    'Xiaomi',
    'Huawei',
    'Oppo',
    'Vivo',
    'Sony',
    'LG',
    'Motorola',
    'Nokia',
    'Asus',
    'Lenovo',
    'HP',
    'Dell',
    'Microsoft',
    'Acer',
  ];

  const enhancedBrands = useMemo(() => {
    // Combine existing brands with common brands, remove duplicates
    const combined = [...brandSuggestions, ...commonBrands];
    return Array.from(new Set(combined)).sort();
  }, [brandSuggestions]);

  return { brandSuggestions: enhancedBrands, isLoading };
}

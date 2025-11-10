import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseColorSuggestionsReturn {
  colorSuggestions: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get color suggestions from existing product units
 * Provides autocomplete suggestions for the color field
 * @param categoryId - Optional category ID to filter colors by product category
 */
export function useColorSuggestions(categoryId?: number): UseColorSuggestionsReturn {
  const [colors, setColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common predefined colors for mobile devices
  const predefinedColors = [
    'Black',
    'White',
    'Silver',
    'Space Gray',
    'Gold',
    'Rose Gold',
    'Blue',
    'Red',
    'Green',
    'Purple',
    'Pink',
    'Yellow',
    'Orange',
    'Midnight',
    'Starlight',
    'Product Red',
    'Deep Purple',
    'Alpine Green',
    'Sierra Blue',
    'Graphite',
    'Pacific Blue',
    'Coral',
    'Mint'
  ];

  useEffect(() => {
    const fetchUniqueColors = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query - join with products to filter by category
        let query = supabase
          .from('product_units')
          .select('color, products!inner(category_id)')
          .not('color', 'is', null)
          .not('color', 'eq', '');

        // Filter by category if provided
        if (categoryId !== undefined) {
          query = query.eq('products.category_id', categoryId);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        // Extract unique colors
        const uniqueColors = data
          ? Array.from(new Set(data.map(item => item.color).filter(Boolean)))
          : [];

        setColors(uniqueColors);
      } catch (err) {
        console.error('Failed to fetch color suggestions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch colors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUniqueColors();
  }, [categoryId]);

  // Combine predefined colors with database colors
  const colorSuggestions = useMemo(() => {
    const dbColors = colors.filter(color => color && color.trim());
    const combined = [...predefinedColors, ...dbColors];
    
    // Remove duplicates (case-insensitive) and sort
    const unique = Array.from(new Set(combined.map(c => c.toLowerCase())))
      .map(lowerColor => combined.find(c => c.toLowerCase() === lowerColor)!)
      .sort();

    return unique;
  }, [colors]);

  return {
    colorSuggestions,
    isLoading,
    error
  };
}

/**
 * Hook to filter color suggestions based on search query
 * @param query - Search query to filter colors
 * @param maxResults - Maximum number of results to return
 * @param categoryId - Optional category ID to filter colors by product category
 */
export function useFilteredColorSuggestions(query: string = '', maxResults: number = 10, categoryId?: number) {
  const { colorSuggestions, isLoading, error } = useColorSuggestions(categoryId);

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) {
      return colorSuggestions.slice(0, maxResults);
    }

    const lowerQuery = query.toLowerCase();
    return colorSuggestions
      .filter(color => color.toLowerCase().includes(lowerQuery))
      .slice(0, maxResults);
  }, [colorSuggestions, query, maxResults]);

  return {
    colorSuggestions: filteredSuggestions,
    isLoading,
    error
  };
}
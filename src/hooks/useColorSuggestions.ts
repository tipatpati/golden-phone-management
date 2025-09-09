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
 */
export function useColorSuggestions(): UseColorSuggestionsReturn {
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
        // Get distinct colors from product_units table
        const { data, error: queryError } = await supabase
          .from('product_units')
          .select('color')
          .not('color', 'is', null)
          .not('color', 'eq', '');

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
  }, []);

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
 */
export function useFilteredColorSuggestions(query: string = '', maxResults: number = 10) {
  const { colorSuggestions, isLoading, error } = useColorSuggestions();

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
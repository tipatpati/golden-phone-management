import { supabase } from "@/integrations/supabase/client";
import type { Brand, Model } from "../brands/types";
import type { Product } from "../inventory/types";

/**
 * Comprehensive search entity type
 */
export interface SearchResult {
  id: string;
  type: 'brand' | 'model' | 'product';
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Search filters for fine-tuned results
 */
export interface SearchFilters {
  entityTypes?: ('brand' | 'model' | 'product')[];
  categoryId?: number;
  brandId?: string;
  minScore?: number;
  hasStock?: boolean;
  maxResults?: number;
}

/**
 * Search suggestions for autocomplete
 */
export interface SearchSuggestion {
  value: string;
  type: 'brand' | 'model' | 'product' | 'category';
  count?: number;
  metadata?: Record<string, any>;
}

/**
 * Optimized search service that leverages the enhanced database features
 * Provides unified search across brands, models, and products with intelligent scoring
 */
export class OptimizedSearchService {
  private static instance: OptimizedSearchService;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): OptimizedSearchService {
    if (!OptimizedSearchService.instance) {
      OptimizedSearchService.instance = new OptimizedSearchService();
    }
    return OptimizedSearchService.instance;
  }

  /**
   * Debounced search with caching for better performance
   */
  async debouncedSearch(
    query: string,
    filters: SearchFilters = {},
    debounceMs: number = 300
  ): Promise<SearchResult[]> {
    const key = `search_${JSON.stringify({ query, filters })}`;
    
    return new Promise((resolve) => {
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const results = await this.search(query, filters);
          resolve(results);
        } catch (error) {
          console.error('Search error:', error);
          resolve([]);
        }
        this.debounceTimers.delete(key);
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Main search function that searches across all entities
   */
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const {
      entityTypes = ['brand', 'model', 'product'],
      maxResults = 50,
      minScore = 0.1
    } = filters;

    const results: SearchResult[] = [];

    // Search brands if requested
    if (entityTypes.includes('brand')) {
      const brandResults = await this.searchBrands(query, filters);
      results.push(...brandResults);
    }

    // Search models if requested
    if (entityTypes.includes('model')) {
      const modelResults = await this.searchModels(query, filters);
      results.push(...modelResults);
    }

    // Search products if requested
    if (entityTypes.includes('product')) {
      const productResults = await this.searchProducts(query, filters);
      results.push(...productResults);
    }

    // Sort by score and apply limits
    return results
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Search brands using the optimized database function
   */
  private async searchBrands(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc('search_brands', {
      search_term: query,
      max_results: filters.maxResults || 20
    });

    if (error) {
      console.error('Brand search error:', error);
      return [];
    }

    return (data || []).map((brand: any) => ({
      id: brand.id,
      type: 'brand' as const,
      name: brand.name,
      slug: brand.slug,
      description: `Brand in ${brand.category_id ? 'category' : 'general'}`,
      score: brand.score,
      metadata: {
        categoryId: brand.category_id,
        logoUrl: brand.logo_url
      }
    }));
  }

  /**
   * Search models using the optimized database function
   */
  private async searchModels(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const { data, error } = await supabase.rpc('search_models', {
      search_term: query,
      brand_name: null,
      max_results: filters.maxResults || 20
    });

    if (error) {
      console.error('Model search error:', error);
      return [];
    }

    return (data || []).map((model: any) => ({
      id: model.id,
      type: 'model' as const,
      name: model.name,
      slug: model.slug,
      brand: model.brand_name,
      description: `${model.brand_name} ${model.name}`,
      score: model.score,
      metadata: {
        brandId: model.brand_id,
        categoryId: model.category_id,
        storageVariants: model.storage_variants,
        colorVariants: model.color_variants,
        releaseYear: model.release_year
      }
    }));
  }

  /**
   * Search products with enhanced filtering
   */
  private async searchProducts(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    let queryBuilder = supabase
      .from('products')
      .select(`
        id, brand, model, description, price, stock, 
        has_serial, category_id, year
      `)
      .or(`brand.ilike.%${query}%,model.ilike.%${query}%,description.ilike.%${query}%`);

    // Apply filters
    if (filters.categoryId) {
      queryBuilder = queryBuilder.eq('category_id', filters.categoryId);
    }

    if (filters.hasStock) {
      queryBuilder = queryBuilder.gt('stock', 0);
    }

    const { data, error } = await queryBuilder
      .order('stock', { ascending: false })
      .limit(filters.maxResults || 20);

    if (error) {
      console.error('Product search error:', error);
      return [];
    }

    return (data || []).map((product: any) => {
      // Calculate score based on query match
      const brandMatch = product.brand.toLowerCase().includes(query.toLowerCase()) ? 0.8 : 0;
      const modelMatch = product.model.toLowerCase().includes(query.toLowerCase()) ? 0.9 : 0;
      const descMatch = product.description?.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
      const score = Math.max(brandMatch, modelMatch, descMatch);

      return {
        id: product.id,
        type: 'product' as const,
        name: `${product.brand} ${product.model}`,
        brand: product.brand,
        model: product.model,
        description: product.description || `${product.brand} ${product.model}`,
        score,
        metadata: {
          price: product.price,
          stock: product.stock,
          hasSerial: product.has_serial,
          categoryId: product.category_id,
          year: product.year
        }
      };
    });
  }

  /**
   * Get smart suggestions for autocomplete
   */
  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query.trim()) return [];

    const suggestions: SearchSuggestion[] = [];

    try {
      // Get brand suggestions
      const { data: brands } = await supabase.rpc('search_brands', {
        search_term: query,
        max_results: 5
      });

      if (brands) {
        suggestions.push(...brands.map((brand: any) => ({
          value: brand.name,
          type: 'brand' as const,
          metadata: { id: brand.id, slug: brand.slug }
        })));
      }

      // Get model suggestions  
      const { data: models } = await supabase.rpc('search_models', {
        search_term: query,
        brand_name: null,
        max_results: 5
      });

      if (models) {
        suggestions.push(...models.map((model: any) => ({
          value: `${model.brand_name} ${model.name}`,
          type: 'model' as const,
          metadata: { 
            id: model.id, 
            slug: model.slug,
            brandId: model.brand_id,
            brandName: model.brand_name
          }
        })));
      }

      // Get unique product combinations
      const { data: products } = await supabase
        .from('products')
        .select('brand, model, stock')
        .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
        .gt('stock', 0)
        .limit(5);

      if (products) {
        const uniqueProducts = new Map();
        products.forEach((product: any) => {
          const key = `${product.brand} ${product.model}`;
          if (!uniqueProducts.has(key)) {
            uniqueProducts.set(key, {
              value: key,
              type: 'product' as const,
              count: product.stock,
              metadata: { 
                brand: product.brand, 
                model: product.model 
              }
            });
          }
        });
        suggestions.push(...Array.from(uniqueProducts.values()));
      }

    } catch (error) {
      console.error('Suggestions error:', error);
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get popular search terms based on recent activity
   */
  async getPopularSearches(limit: number = 5): Promise<string[]> {
    // This could be enhanced with analytics tracking
    // For now, return some common search patterns
    const { data: brands } = await supabase
      .from('brands')
      .select('name')
      .order('name')
      .limit(limit);

    return brands?.map(b => b.name) || [];
  }

  /**
   * Clear all debounce timers
   */
  clearDebounceTimers(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Export singleton instance
export const optimizedSearchService = OptimizedSearchService.getInstance();
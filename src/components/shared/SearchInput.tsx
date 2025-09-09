import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";
import type { SearchFilters, SearchResult } from "@/services/core/OptimizedSearchService";

interface SearchInputProps {
  placeholder?: string;
  filters?: SearchFilters;
  onResultSelect?: (result: SearchResult) => void;
  onSearchChange?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  clearOnSelect?: boolean;
}

/**
 * Advanced search input component with real-time suggestions
 * Leverages the OptimizedSearchService for enhanced search capabilities
 */
export function SearchInput({
  placeholder = "Search brands, models, or products...",
  filters = {},
  onResultSelect,
  onSearchChange,
  className,
  autoFocus = false,
  showSuggestions = true,
  maxSuggestions = 8,
  clearOnSelect = false
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    suggestions,
    isLoading,
    hasResults,
    resultsByType
  } = useOptimizedSearch(filters, {
    enableSuggestions: showSuggestions,
    maxResults: maxSuggestions
  });

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    onSearchChange?.(value);
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result);
    
    if (clearOnSelect) {
      setQuery('');
    } else {
      setQuery(result.name);
    }
    
    setIsFocused(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasResults && suggestions.length === 0) return;

    const totalItems = results.length + suggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex]);
          } else {
            const suggestionIndex = selectedIndex - results.length;
            const suggestion = suggestions[suggestionIndex];
            if (suggestion) {
              setQuery(suggestion.value);
              setIsFocused(false);
            }
          }
        }
        break;
      
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && (hasResults || suggestions.length > 0 || isLoading);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          className={cn("pl-10 pr-10", className)}
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-auto shadow-lg">
          <CardContent className="p-0" ref={resultsRef}>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {/* Search Results */}
            {hasResults && (
              <div className="border-b border-border last:border-b-0">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  Search Results ({results.length})
                </div>
                
                {Object.entries(resultsByType).map(([type, typeResults]) => (
                  <div key={type}>
                    {typeResults.length > 0 && (
                      <div className="px-3 py-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                          {type}s
                        </div>
                        {typeResults.map((result, index) => {
                          const globalIndex = results.indexOf(result);
                          const isSelected = selectedIndex === globalIndex;
                          
                          return (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => handleResultSelect(result)}
                              className={cn(
                                "w-full text-left px-2 py-2 rounded text-sm transition-colors",
                                isSelected 
                                  ? "bg-accent text-accent-foreground" 
                                  : "hover:bg-accent/50"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{result.name}</div>
                                  {result.description && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {result.description}
                                    </div>
                                  )}
                                  {result.brand && result.model && (
                                    <div className="text-xs text-muted-foreground">
                                      {result.brand} • {result.model}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-1 ml-2">
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {type}
                                  </Badge>
                                  {result.metadata?.stock !== undefined && (
                                    <Badge 
                                      variant={result.metadata.stock > 0 ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      {result.metadata.stock} in stock
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-b border-border last:border-b-0">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  Suggestions
                </div>
                
                {suggestions.slice(0, maxSuggestions).map((suggestion, index) => {
                  const globalIndex = results.length + index;
                  const isSelected = selectedIndex === globalIndex;
                  
                  return (
                    <button
                      key={`${suggestion.type}-${suggestion.value}`}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion.value);
                        setIsFocused(false);
                      }}
                      className={cn(
                        "w-full text-left px-5 py-2 text-sm transition-colors",
                        isSelected 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{suggestion.value}</span>
                        <div className="flex items-center space-x-1 ml-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {suggestion.type}
                          </Badge>
                          {suggestion.count && (
                            <span className="text-xs text-muted-foreground">
                              {suggestion.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {!isLoading && !hasResults && suggestions.length === 0 && query.trim() && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
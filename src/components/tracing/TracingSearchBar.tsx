import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Scan, X } from 'lucide-react';
import { useSerialSuggestions } from '@/hooks/useProductTrace';
import { cn } from '@/lib/utils';

interface TracingSearchBarProps {
  onSearch: (serialNumber: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function TracingSearchBar({ 
  onSearch, 
  isLoading = false, 
  placeholder = "Enter serial number or IMEI...",
  className 
}: TracingSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSerialSuggestions(query);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
  };

  useEffect(() => {
    setShowSuggestions(query.length >= 2 && suggestions.length > 0);
  }, [query, suggestions]);

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(query.length >= 2 && suggestions.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={isLoading}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="h-8"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-[9999] max-h-60 overflow-y-auto">
          {suggestionsLoading ? (
            <div className="p-3 text-center text-muted-foreground">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="p-2 text-xs text-muted-foreground border-b">
                Serial Number Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-3 hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Scan className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="p-3 text-center text-muted-foreground">
              No matching serial numbers found
            </div>
          )}
        </div>
      )}

      {/* Quick tips */}
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          <Scan className="h-3 w-3 mr-1" />
          Scan or type serial number
        </Badge>
        <Badge variant="outline" className="text-xs">
          Press Enter to search
        </Badge>
      </div>
    </div>
  );
}
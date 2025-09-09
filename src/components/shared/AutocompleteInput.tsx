import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickSearch } from "@/hooks/useOptimizedSearch";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions?: string[];
  entityTypes?: ('brand' | 'model' | 'product')[];
  className?: string;
  disabled?: boolean;
  maxSuggestions?: number;
  minQueryLength?: number;
}

/**
 * Enhanced autocomplete input that combines static suggestions with dynamic search
 * Uses the OptimizedSearchService for intelligent suggestions
 */
export function AutocompleteInput({
  value,
  onChange,
  onBlur,
  placeholder = "Type to search...",
  suggestions = [],
  entityTypes = ['brand', 'model'],
  className,
  disabled = false,
  maxSuggestions = 8,
  minQueryLength = 1
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Use optimized search for dynamic suggestions
  const {
    setQuery,
    suggestions: searchSuggestions,
    isLoading
  } = useQuickSearch(entityTypes);

  // Combine static suggestions with search suggestions
  const allSuggestions = React.useMemo(() => {
    const staticMatches = suggestions.filter(s => 
      s.toLowerCase().includes(value.toLowerCase())
    );
    
    const dynamicMatches = searchSuggestions.map(s => s.value);
    
    // Remove duplicates and limit results
    const combined = Array.from(new Set([...staticMatches, ...dynamicMatches]));
    return combined.slice(0, maxSuggestions);
  }, [suggestions, searchSuggestions, value, maxSuggestions]);

  // Update search query when value changes
  useEffect(() => {
    if (value.length >= minQueryLength) {
      setQuery(value);
    }
  }, [value, setQuery, minQueryLength]);

  // Handle input change
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedIndex(-1);
    setIsOpen(newValue.length >= minQueryLength);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          handleSuggestionSelect(allSuggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      
      case 'Tab':
        // Allow tab to select current suggestion
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          e.preventDefault();
          handleSuggestionSelect(allSuggestions[selectedIndex]);
        } else {
          setIsOpen(false);
        }
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (value.length >= minQueryLength && allSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
      onBlur?.();
    }, 150);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const showDropdown = isOpen && (allSuggestions.length > 0 || isLoading);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />

      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-auto shadow-lg">
          <CardContent className="p-0" ref={listRef}>
            {isLoading && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading suggestions...</span>
              </div>
            )}

            {allSuggestions.map((suggestion, index) => {
              const isSelected = selectedIndex === index;
              const isExactMatch = suggestion.toLowerCase() === value.toLowerCase();
              
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                    isSelected 
                      ? "bg-accent text-accent-foreground" 
                      : "hover:bg-accent/50"
                  )}
                >
                  <span className="truncate">{suggestion}</span>
                  {isExactMatch && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}

            {!isLoading && allSuggestions.length === 0 && value.length >= minQueryLength && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No suggestions found
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
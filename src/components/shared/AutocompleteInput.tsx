import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickSearch } from "@/hooks/useOptimizedSearch";
import { ScrollableDropdown, useDropdownKeyboard, type DropdownItem } from "@/components/ui/scrollable-dropdown";

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
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Only include dynamic matches if entityTypes is not empty
    const dynamicMatches = entityTypes.length > 0
      ? searchSuggestions.map(s => s.value)
      : [];

    // Remove duplicates and limit results
    const combined = Array.from(new Set([...staticMatches, ...dynamicMatches]));
    return combined.slice(0, maxSuggestions);
  }, [suggestions, searchSuggestions, value, maxSuggestions, entityTypes.length]);

  // Convert suggestions to dropdown items
  const dropdownItems: DropdownItem<string>[] = React.useMemo(() => {
    return allSuggestions.map((suggestion, index) => ({
      id: `${suggestion}-${index}`,
      label: suggestion,
      value: suggestion,
      badge: suggestion.toLowerCase() === value.toLowerCase() ? (
        <Check className="h-4 w-4 text-primary" />
      ) : undefined,
    }));
  }, [allSuggestions, value]);

  // Keyboard navigation
  const {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: handleDropdownKeyDown
  } = useDropdownKeyboard(
    isOpen,
    dropdownItems.length,
    () => {
      if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
        handleSuggestionSelect(allSuggestions[selectedIndex]);
      }
    },
    () => {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  );

  // Update search query when value changes (only if dynamic search is enabled)
  useEffect(() => {
    if (entityTypes.length > 0 && value.length >= minQueryLength) {
      setQuery(value);
    }
  }, [value, setQuery, minQueryLength, entityTypes.length]);

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
        onKeyDown={handleDropdownKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />

      <ScrollableDropdown
        isOpen={showDropdown}
        items={dropdownItems}
        selectedIndex={selectedIndex}
        onItemSelect={(item) => handleSuggestionSelect(item.value)}
        onSelectedIndexChange={setSelectedIndex}
        isLoading={isLoading}
        emptyMessage="No suggestions found"
        loadingMessage="Loading suggestions..."
        maxHeight="md"
        variant="card"
      />
    </div>
  );
}
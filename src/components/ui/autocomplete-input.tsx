import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScrollableDropdown, useDropdownKeyboard, type DropdownItem } from "@/components/ui/scrollable-dropdown";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
  disabled
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions
    .filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase()) &&
      suggestion.toLowerCase() !== value.toLowerCase()
    )
    .slice(0, 5);

  // Convert suggestions to dropdown items
  const dropdownItems: DropdownItem<string>[] = React.useMemo(() => {
    return filteredSuggestions.map((suggestion, index) => ({
      id: `${suggestion}-${index}`,
      label: suggestion,
      value: suggestion,
    }));
  }, [filteredSuggestions]);

  // Keyboard navigation
  const {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: handleDropdownKeyDown
  } = useDropdownKeyboard(
    showSuggestions,
    dropdownItems.length,
    () => {
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        handleSuggestionClick(filteredSuggestions[selectedIndex]);
      }
    },
    () => {
      setShowSuggestions(false);
    }
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value, setSelectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleFocus = () => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleDropdownKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />

      <ScrollableDropdown
        isOpen={showSuggestions && filteredSuggestions.length > 0}
        items={dropdownItems}
        selectedIndex={selectedIndex}
        onItemSelect={(item) => handleSuggestionClick(item.value)}
        onSelectedIndexChange={setSelectedIndex}
        maxHeight="md"
        variant="plain"
        className="bg-background/95 backdrop-blur-sm"
      />
    </div>
  );
}
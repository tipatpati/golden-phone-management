import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollableDropdown, useDropdownKeyboard, type DropdownItem } from "@/components/ui/scrollable-dropdown";

interface Product {
  id: string;
  brand: string;
  model: string;
  has_serial: boolean;
}

interface ProductSearchSelectorProps {
  products: Product[];
  value?: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function ProductSearchSelector({
  products,
  value,
  onChange,
  placeholder = "Search products...",
  className,
  error
}: ProductSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = products.find(p => p.id === value);

  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.brand.toLowerCase().includes(searchLower) ||
      product.model.toLowerCase().includes(searchLower)
    );
  }).slice(0, 50); // Limit to 50 results for performance

  // Convert products to dropdown items
  const dropdownItems: DropdownItem<Product>[] = React.useMemo(() => {
    return filteredProducts.map(product => ({
      id: product.id,
      label: `${product.brand} ${product.model}`,
      value: product,
      description: product.has_serial ? 'Serialized Product' : undefined,
    }));
  }, [filteredProducts]);

  // Keyboard navigation
  const {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown: handleDropdownKeyDown
  } = useDropdownKeyboard(
    showSuggestions,
    dropdownItems.length,
    () => {
      if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
        handleProductSelect(filteredProducts[selectedIndex]);
      }
    },
    () => {
      setShowSuggestions(false);
    }
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery, setSelectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleProductSelect = (product: Product) => {
    onChange(product.id);
    setSearchQuery("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    onChange("");
    setSearchQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleFocus = () => {
    if (searchQuery && filteredProducts.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      {selectedProduct ? (
        <div className={cn(
          "flex items-center justify-between gap-2 p-2 border rounded-md bg-background",
          error && "border-destructive"
        )}>
          <span className="text-sm flex-1">
            {selectedProduct.brand} {selectedProduct.model}
            {selectedProduct.has_serial && (
              <span className="ml-2 text-xs text-muted-foreground">(Serialized)</span>
            )}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleDropdownKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={placeholder}
              className={cn("pl-9", error && "border-destructive", className)}
            />
          </div>

          <ScrollableDropdown
            isOpen={showSuggestions && (filteredProducts.length > 0 || searchQuery.length > 0)}
            items={dropdownItems}
            selectedIndex={selectedIndex}
            onItemSelect={(item) => handleProductSelect(item.value)}
            onSelectedIndexChange={setSelectedIndex}
            emptyMessage="No products found"
            maxHeight="md"
            variant="plain"
          />
        </>
      )}
    </div>
  );
}

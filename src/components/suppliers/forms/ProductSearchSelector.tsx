import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === value);

  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.brand.toLowerCase().includes(searchLower) ||
      product.model.toLowerCase().includes(searchLower)
    );
  }).slice(0, 50); // Limit to 50 results for performance

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleProductSelect(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking within the dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
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
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={placeholder}
              className={cn("pl-9", error && "border-destructive", className)}
            />
          </div>

          {showSuggestions && filteredProducts.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={cn(
                    "px-3 py-2 cursor-pointer hover:bg-muted transition-colors text-sm border-b last:border-b-0",
                    selectedIndex === index && "bg-muted"
                  )}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="font-medium">
                    {product.brand} {product.model}
                  </div>
                  {product.has_serial && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Serialized Product
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showSuggestions && searchQuery && filteredProducts.length === 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg p-3">
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

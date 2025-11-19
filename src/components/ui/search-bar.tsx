/**
 * Standardized Search Bar Component
 * Material Design 3 compliant with consistent styling
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isSearching?: boolean;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  onKeyDown,
  isSearching = false,
  onClear,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="pl-11 pr-10 h-12 glass-card border-outline-variant/30 hover:border-primary/30 font-light"
      />
      {isSearching && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
      )}
      {value && !isSearching && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}

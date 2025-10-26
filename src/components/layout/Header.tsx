import React from "react";
import { Bell, ShoppingCart, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { StoreSelector } from "@/components/stores/StoreSelector";
import { useIsMobile } from "@/hooks/use-mobile";
interface HeaderProps {
  isMenuOpen?: boolean;
  toggleMenu?: () => void;
}

export function Header({ isMenuOpen, toggleMenu }: HeaderProps = {}) {
  const isMobile = useIsMobile();
  
  return (
    <header 
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-surface border-b border-border px-4 sm:px-6 md:px-8"
      style={{ boxShadow: 'var(--elevation-2)' }}
      role="banner"
    >
      {/* Mobile menu button */}
      {isMobile && toggleMenu && (
        <Button 
          variant="text" 
          size="icon" 
          onClick={toggleMenu}
          className="mr-2 h-10 w-10"
          aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}
      
      <div className="flex flex-1 items-center justify-center gap-2 sm:gap-4 min-w-0">
        <div className="relative w-full max-w-[280px] sm:max-w-sm lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-on-surface-variant"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Cerca..."
            className="pl-12 h-12 rounded-full border border-border bg-surface-container text-sm"
            aria-label="Cerca nel sistema"
          />
        </div>
      </div>

      {/* Store Selector - Shows when user has multiple stores */}
      <div className="hidden md:block ml-3 sm:ml-4">
        <StoreSelector />
      </div>

      {/* Theme Toggle */}
      <div className="ml-3 sm:ml-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
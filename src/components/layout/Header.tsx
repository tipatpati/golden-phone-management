import React from "react";
import { Bell, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
export function Header() {
  return <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
        <div className="relative w-full max-w-[200px] sm:max-w-sm lg:max-w-md">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="w-full rounded-md border pl-8 h-9 sm:h-10 text-sm focus-visible:ring-yellow-400" />
        </div>
      </div>
      
      <i className="button-effects"></i>
      
    </header>;
}
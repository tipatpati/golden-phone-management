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
      
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[9px] sm:text-[10px] flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500">
            3
          </Badge>
        </Button>
        
        <Button variant="outline" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center">
          <ShoppingCart className="h-4 w-4" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[9px] sm:text-[10px] flex items-center justify-center bg-gradient-to-r from-yellow-400 to-amber-500">
            2
          </Badge>
        </Button>
        
        <Button variant="default" className="hidden sm:flex h-10 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 text-sm sm:text-base">
          New Sale
        </Button>
        <Button variant="default" size="icon" className="sm:hidden h-9 w-9 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </header>;
}
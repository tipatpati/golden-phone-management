import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";

interface SalesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
}

export function SalesSearchBar({ searchTerm, onSearchChange, isSearching = false }: SalesSearchBarProps) {
  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Cerca per numero garentille, nome cliente o note..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all">
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-2">
            {isSearching ? "Ricerca in corso..." : `Ricerca: "${searchTerm}"`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
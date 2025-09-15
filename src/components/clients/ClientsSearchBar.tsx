
import React from "react";
import { Card, CardContent } from "@/components/ui/updated-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ClientsSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ClientsSearchBar = ({ searchTerm, onSearchChange }: ClientsSearchBarProps) => {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca clienti per nome, email o telefono..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
            type="search"
          />
        </div>
      </CardContent>
    </Card>
  );
};

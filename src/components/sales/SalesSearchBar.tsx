import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

interface SalesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SalesSearchBar({ searchTerm, onSearchChange }: SalesSearchBarProps) {
  return (
    <Card className="border-0 shadow-xl bg-white">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by sale number, client name, or notes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
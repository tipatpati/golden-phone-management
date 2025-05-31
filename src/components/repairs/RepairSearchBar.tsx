
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RepairSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const RepairSearchBar: React.FC<RepairSearchBarProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, device, repair ID, or IMEI..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardContent>
    </Card>
  );
};

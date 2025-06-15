
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useClients } from "@/services/useClients";

type ClientSearchBarProps = {
  selectedClient: any;
  onClientSelect: (client: any) => void;
  onClientClear: () => void;
};

export function ClientSearchBar({ selectedClient, onClientSelect, onClientClear }: ClientSearchBarProps) {
  const [clientSearch, setClientSearch] = useState("");
  const { data: clients = [] } = useClients(clientSearch);

  const getClientDisplayName = (client: any) => {
    return client.type === 'business' 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      {selectedClient ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {getClientDisplayName(selectedClient)}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClientClear}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca clienti..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {clientSearch && clients.length > 0 && (
            <div className="border rounded-md max-h-32 overflow-y-auto bg-white z-50">
              {clients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => {
                    onClientSelect(client);
                    setClientSearch("");
                  }}
                >
                  <div className="font-medium">
                    {getClientDisplayName(client)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {client.email} • {client.phone}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

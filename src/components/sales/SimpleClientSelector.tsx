import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useClients } from "@/services";

interface SimpleClientSelectorProps {
  value?: string;
  onChange: (clientId: string) => void;
  placeholder?: string;
}

export function SimpleClientSelector({ value, onChange, placeholder = "Select a client..." }: SimpleClientSelectorProps) {
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientData, setSelectedClientData] = useState<any>(null);
  const { data: clientsData = [] } = useClients(clientSearch);
  const clients = Array.isArray(clientsData) ? clientsData : [];

  // Find selected client data when value changes
  React.useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find(c => c.id === value);
      if (client) {
        setSelectedClientData(client);
      }
    } else if (!value) {
      setSelectedClientData(null);
    }
  }, [value, clients]);

  const getClientDisplayName = (client: any) => {
    return client.type === 'business' 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const handleClientSelect = (client: any) => {
    setSelectedClientData(client);
    onChange(client.id);
    setClientSearch("");
  };

  const handleClientClear = () => {
    setSelectedClientData(null);
    onChange("");
    setClientSearch("");
  };

  return (
    <div className="space-y-3">
      {selectedClientData ? (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            {getClientDisplayName(selectedClientData)}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClientClear}
            className="min-h-[36px] min-w-[36px] p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10"
              type="search"
            />
          </div>
          {clientSearch && clients.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
              {clients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
                  onClick={() => handleClientSelect(client)}
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
          {clientSearch && clients.length === 0 && (
            <div className="border rounded-lg p-4 text-center bg-background">
              <p className="text-sm text-muted-foreground">No clients found for "{clientSearch}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
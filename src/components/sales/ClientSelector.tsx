
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useClients } from "@/services";
import { NewClientDialogInSales } from "./NewClientDialogInSales";

type ClientSelectorProps = {
  selectedClient: any;
  onClientSelect: (client: any) => void;
  onClientClear: () => void;
};

export function ClientSelector({ selectedClient, onClientSelect, onClientClear }: ClientSelectorProps) {
  const [clientSearch, setClientSearch] = useState("");
  const { data: clientsData = [] } = useClients(clientSearch);
  const clients = Array.isArray(clientsData) ? clientsData : [];

  const getClientDisplayName = (client: any) => {
    return client.type === 'business' 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  return (
    <div className="space-y-2">
      <Label>Cliente (Opzionale)</Label>
      {selectedClient ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
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
              type="search"
            />
          </div>
          {clientSearch && clients.length > 0 && (
            <div className="border rounded-md max-h-32 overflow-y-auto">
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
          {clientSearch && clients.length === 0 && (
            <div className="border rounded-md p-3 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Nessun cliente trovato per "{clientSearch}"</p>
              <NewClientDialogInSales 
                onClientCreated={(newClient) => {
                  onClientSelect(newClient);
                  setClientSearch("");
                }}
              />
            </div>
          )}
          {!clientSearch && (
            <div className="flex justify-center mt-2">
              <NewClientDialogInSales 
                onClientCreated={(newClient) => {
                  onClientSelect(newClient);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

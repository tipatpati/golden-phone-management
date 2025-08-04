
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
    <div className="space-y-3">
      <Label className="text-base font-medium">Cliente (Opzionale)</Label>
      {selectedClient ? (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <Badge variant="outline" className="text-sm px-3 py-1.5">
            {getClientDisplayName(selectedClient)}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClientClear}
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
              placeholder="Cerca clienti..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-10 h-12 text-base"
              type="search"
            />
          </div>
          {clientSearch && clients.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto bg-background shadow-lg">
              {clients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors active:bg-muted"
                  onClick={() => {
                    onClientSelect(client);
                    setClientSearch("");
                  }}
                >
                  <div className="font-medium text-base">
                    {getClientDisplayName(client)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {client.email} • {client.phone}
                  </div>
                </div>
              ))}
            </div>
          )}
          {clientSearch && clients.length === 0 && (
            <div className="border rounded-lg p-4 text-center space-y-3 bg-background">
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
            <div className="flex justify-center mt-3">
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

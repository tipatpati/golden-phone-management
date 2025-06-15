
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, User, Phone, Mail } from "lucide-react";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { type Client } from "@/services/useClients";
import { format } from "date-fns";

interface ClientsListProps {
  clients: Client[];
}

export const ClientsList = ({ clients }: ClientsListProps) => {
  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white hover:bg-gray-50/50 transform hover:-translate-y-1">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Client Info */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${client.type === "business" ? "bg-purple-100" : "bg-blue-100"}`}>
                    {client.type === "business" ? (
                      <Building className="h-4 w-4 text-purple-600" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{getClientDisplayName(client)}</div>
                    {client.type === "business" && client.contact_person && (
                      <div className="text-sm text-muted-foreground">
                        Contact: {client.contact_person}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-3">
                <div className="space-y-1">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Created Date */}
              <div className="lg:col-span-2">
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {format(new Date(client.created_at!), "MMM dd, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
              </div>

              {/* Type */}
              <div className="lg:col-span-1">
                <Badge variant="outline" className={client.type === 'business' ? 'border-purple-200 text-purple-700' : 'border-blue-200 text-blue-700'}>
                  {client.type === 'business' ? 'B2B' : 'B2C'}
                </Badge>
              </div>

              {/* Status */}
              <div className="lg:col-span-1">
                <Badge variant={getStatusColor(client.status)}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </Badge>
              </div>

              {/* Actions */}
              <div className="lg:col-span-1">
                <div className="flex gap-2">
                  <EditClientDialog client={client} />
                  <DeleteClientDialog client={client} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

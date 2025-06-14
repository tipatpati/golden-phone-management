
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building, User, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { useClients } from "@/services/useClients";
import { format } from "date-fns";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clients = [], isLoading, error } = useClients(searchTerm);

  const getClientDisplayName = (client: any) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const individualClients = clients.filter(c => c.type === "individual");
  const businessClients = clients.filter(c => c.type === "business");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Client Management</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Client Management</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-500">Error loading clients. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Client Management</h2>
          <p className="text-muted-foreground">
            Manage individual and business clients, track purchases and contact information.
          </p>
        </div>
        <NewClientDialog />
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{individualClients.length}</div>
              <div className="text-sm text-muted-foreground">Individual Clients</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{businessClients.length}</div>
              <div className="text-sm text-muted-foreground">Business Clients</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Client Info */}
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-2">
                    {client.type === "business" ? (
                      <Building className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-semibold">{getClientDisplayName(client)}</div>
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
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Created Date */}
                <div className="lg:col-span-2">
                  <div className="text-center">
                    <div className="font-medium">
                      {format(new Date(client.created_at!), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">Created</div>
                  </div>
                </div>

                {/* Type */}
                <div className="lg:col-span-1">
                  <Badge variant="outline">
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
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No clients found matching your search." : "No clients yet. Add your first client!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;

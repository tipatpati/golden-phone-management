import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building, User, Phone, Mail, Edit, Trash2, Users, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
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
  const activeClients = clients.filter(c => c.status === "active");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Client Management
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-0">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Client Management
            </h2>
            <p className="text-red-500 mt-3 text-lg">Error loading clients. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Client Management
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Manage individual and business clients, track purchases and contact information.
              </p>
            </div>
            <NewClientDialog />
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-xl">
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
          
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Individual</CardTitle>
              <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-md">
                <User className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{individualClients.length}</div>
              <div className="text-sm text-blue-600">Personal Clients</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Business</CardTitle>
              <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 shadow-md">
                <Building className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{businessClients.length}</div>
              <div className="text-sm text-purple-600">Business Clients</div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
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

        {clients.length === 0 && (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {searchTerm ? "No clients found" : "No clients yet"}
                  </h3>
                  <p className="text-muted-foreground text-base max-w-md mx-auto">
                    {searchTerm 
                      ? "Try adjusting your search criteria or clear the search to see all clients." 
                      : "Get started by adding your first client."
                    }
                  </p>
                </div>
                {!searchTerm && <NewClientDialog />}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Clients;

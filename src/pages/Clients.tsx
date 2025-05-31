
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building, User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock client data
  const clients = [
    {
      id: "CLI-001",
      type: "individual",
      firstName: "John",
      lastName: "Doe", 
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      totalPurchases: 1029.98,
      lastPurchase: "2024-01-15",
      status: "active"
    },
    {
      id: "CLI-002",
      type: "business",
      companyName: "Tech Solutions Inc.",
      contactPerson: "Sarah Johnson",
      email: "sarah@techsolutions.com",
      phone: "+1 (555) 987-6543",
      totalPurchases: 15750.50,
      lastPurchase: "2024-01-14",
      status: "active"
    },
    {
      id: "CLI-003",
      type: "individual", 
      firstName: "Maria",
      lastName: "Garcia",
      email: "maria.garcia@email.com",
      phone: "+1 (555) 456-7890",
      totalPurchases: 599.97,
      lastPurchase: "2024-01-10",
      status: "active"
    },
    {
      id: "CLI-004",
      type: "business",
      companyName: "Digital Marketing Pro",
      contactPerson: "Mike Chen",
      email: "mike@digitalmarketing.com", 
      phone: "+1 (555) 234-5678",
      totalPurchases: 8920.25,
      lastPurchase: "2024-01-08",
      status: "inactive"
    }
  ];

  const getClientDisplayName = (client: any) => {
    return client.type === "business" 
      ? client.companyName 
      : `${client.firstName} ${client.lastName}`;
  };

  const filteredClients = clients.filter(client => {
    const displayName = getClientDisplayName(client);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.phone.includes(searchTerm);
  });

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

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
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
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
              <div className="text-2xl font-bold">{clients.filter(c => c.type === "individual").length}</div>
              <div className="text-sm text-muted-foreground">Individual Clients</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{clients.filter(c => c.type === "business").length}</div>
              <div className="text-sm text-muted-foreground">Business Clients</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
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
                      {client.type === "business" && (
                        <div className="text-sm text-muted-foreground">
                          Contact: {client.contactPerson}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="lg:col-span-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {client.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {client.phone}
                    </div>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="lg:col-span-2">
                  <div className="text-center">
                    <div className="font-bold">${client.totalPurchases.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Total Purchases</div>
                  </div>
                </div>

                {/* Last Purchase */}
                <div className="lg:col-span-2">
                  <div className="text-center">
                    <div className="font-medium">{client.lastPurchase}</div>
                    <div className="text-sm text-muted-foreground">Last Purchase</div>
                  </div>
                </div>

                {/* Status */}
                <div className="lg:col-span-1">
                  <Badge variant={getStatusColor(client.status)}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No clients found matching your search.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Clients;

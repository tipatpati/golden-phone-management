import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientCard, ClientMetrics } from "./ui";
import { useClientServices } from "./forms/hooks/useClientServices";
import { type Client } from "@/services";
import { Search, Filter, Grid, List, Eye } from "lucide-react";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { EditClientDialog } from "./EditClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import { EmptyClientsList } from "./EmptyClientsList";

interface EnhancedClientsListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function EnhancedClientsList({ clients, onEdit, onDelete }: EnhancedClientsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { statistics, searchClients, filterByType, filterByStatus } = useClientServices();

  // Filter and search clients
  const filteredClients = useMemo(() => {
    let result = clients;
    if (searchTerm) {
      result = result.filter(client => {
        const searchableText = [
          client.first_name, client.last_name, client.company_name, 
          client.email, client.phone
        ].join(' ').toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }
    if (typeFilter !== 'all') {
      result = result.filter(client => client.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter);
    }
    return result;
  }, [searchTerm, typeFilter, statusFilter, clients]);

  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name || 'Unnamed Business'
      : `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed Client';
  };

  if (clients.length === 0) {
    return <div className="text-center py-12"><p>No clients yet</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <ClientMetrics
        totalClients={statistics.totalClients}
        activeClients={statistics.activeClients}
        inactiveClients={statistics.inactiveClients}
        businessClients={statistics.businessClients}
        individualClients={statistics.individualClients}
        clientsWithEmail={statistics.clientsWithEmail}
        clientsWithPhone={statistics.clientsWithPhone}
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Client Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredClients.length} of {clients.length} clients
        </div>
        
        {/* Active Filters */}
        <div className="flex gap-2">
          {searchTerm && (
            <Badge variant="secondary">
              Search: {searchTerm}
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary">
              Type: {typeFilter}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary">
              Status: {statusFilter}
            </Badge>
          )}
        </div>
      </div>

      {/* Clients Display */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No clients found matching your search criteria.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }>
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              name={getClientDisplayName(client)}
              type={client.type as 'individual' | 'business'}
              email={client.email || undefined}
              phone={client.phone || undefined}
              address={client.address || undefined}
              status={client.status as 'active' | 'inactive'}
              notes={client.notes || undefined}
              onView={() => setSelectedClient(client)}
              onEdit={() => onEdit?.(client)}
              onDelete={() => onDelete?.(client)}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </div>
      )}

      {/* Client Details Dialog */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{getClientDisplayName(selectedClient)}</h2>
            <button onClick={() => setSelectedClient(null)} className="absolute top-4 right-4">×</button>
            {/* Client details would go here */}
          </div>
        </div>
      )}
    </div>
  );
}
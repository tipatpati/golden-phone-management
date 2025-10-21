
import React from "react";
import { Button } from "@/components/ui/updated-button";
import { Building, User, Phone, Mail, Edit2, Trash2, Eye, MoreVertical } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import { type Client } from "@/services";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { EditClientDialog } from "./EditClientDialog";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientsListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export const ClientsList = ({ clients, onEdit, onDelete }: ClientsListProps) => {
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Client>();
  const [viewingClient, setViewingClient] = React.useState<Client | null>(null);

  const getClientDisplayName = (client: Client) => {
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const handleDeleteClient = (client: Client) => {
    if (onDelete) {
      showConfirmDialog({
        item: client,
        title: "Elimina Cliente",
        message: `Sei sicuro di voler eliminare "${getClientDisplayName(client)}"? Questa azione non può essere annullata.`,
        onConfirm: () => onDelete(client)
      });
    }
  };

  // Define table columns for desktop view
  const columns = [
    {
      key: 'name' as keyof Client,
      header: 'Cliente',
      render: (value: any, client: Client) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${client.type === "business" ? "bg-info-container" : "bg-secondary-container"}`}>
            {client.type === "business" ? (
              <Building className="h-4 w-4 text-info" />
            ) : (
              <User className="h-4 w-4 text-secondary" />
            )}
          </div>
          <div>
            <div className="font-medium">{getClientDisplayName(client)}</div>
            {client.type === "business" && client.contact_person && (
              <div className="text-sm text-muted-foreground">
                Contatto: {client.contact_person}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email' as keyof Client,
      header: 'Contatto',
      render: (value: any, client: Client) => (
        <div className="space-y-1">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {client.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'type' as keyof Client,
      header: 'Tipo',
      render: (value: string) => (
        <StatusBadge status={value === 'business' ? 'business' : 'individual'}>
          {value === 'business' ? 'B2B' : 'B2C'}
        </StatusBadge>
      )
    },
    {
      key: 'status' as keyof Client,
      header: 'Stato',
      render: (value: string) => (
        <StatusBadge status={value === 'active' ? 'active' : 'inactive'}>
          {value === 'active' ? 'Attivo' : 'Inattivo'}
        </StatusBadge>
      )
    },
    {
      key: 'created_at' as keyof Client,
      header: 'Creato',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(value), "dd/MM/yyyy")}
        </div>
      )
    }
  ];

  // Custom actions column with improved button layout
  const renderActions = (client: Client) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-info-container hover:text-info transition-colors"
        onClick={() => setViewingClient(client)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary-container hover:text-primary transition-colors"
          onClick={() => onEdit(client)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={() => handleDeleteClient(client)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Mobile pagination
  const {
    paginatedData: paginatedMobileClients,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: clients, itemsPerPage: 17 });

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={clients}
          columns={columns}
          actions={[
            {
              icon: <Eye className="h-4 w-4" />,
              label: "Visualizza",
              onClick: () => {},
              renderCustom: renderActions
            }
          ]}
          getRowKey={(client) => client.id}
        />
      </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {paginatedMobileClients.map((client) => (
          <DataCard
            key={client.id}
            title={getClientDisplayName(client)}
            subtitle={client.type === "business" && client.contact_person ? `Contatto: ${client.contact_person}` : undefined}
            icon={client.type === "business" ? 
              <Building className="h-5 w-5 text-purple-600" /> : 
              <User className="h-5 w-5 text-blue-600" />
            }
            badge={{
              text: client.status === 'active' ? 'Attivo' : 'Inattivo',
              variant: getStatusColor(client.status) as any
            }}
            headerActions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setViewingClient(client)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizza Dettagli
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifica
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClient(client)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            }
            fields={[
              {
                label: "Tipo",
                value: <StatusBadge status={client.type === 'business' ? 'business' : 'individual'}>
                  {client.type === 'business' ? 'B2B' : 'B2C'}
                </StatusBadge>
              },
              ...(client.email ? [{
                label: "Email",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )
              }] : []),
              ...(client.phone ? [{
                label: "Telefono",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {client.phone}
                  </div>
                )
              }] : []),
              {
                label: "Creato",
                value: format(new Date(client.created_at!), "dd/MM/yyyy")
              }
            ]}
          />
          ))}
        </div>
        
        {/* Mobile Pagination */}
        {clients.length > 0 && (
          <TablePagination
            currentPage={mobilePage}
            totalPages={mobileTotalPages}
            onPageChange={mobileGoToPage}
            pageSize={17}
            totalItems={clients.length}
          />
        )}
      </div>

      {/* View Client Details Dialog */}
      {viewingClient && (
        <ClientDetailsDialog 
          client={viewingClient}
          open={true}
          onOpenChange={(open) => !open && setViewingClient(null)}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={confirmAction}
        title={dialogState.title}
        message={dialogState.message}
        variant="destructive"
        confirmText="Elimina"
      />
    </>
  );
};

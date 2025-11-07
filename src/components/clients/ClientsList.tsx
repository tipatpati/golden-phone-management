
import React from "react";
import { Building, User, Phone, Mail, Edit2, Trash2, Eye } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import { type Client } from "@/services";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { EditClientDialog } from "./EditClientDialog";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";

interface ClientsListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export const ClientsList = React.memo(function ClientsList({ clients, onEdit, onDelete }: ClientsListProps) {
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



  return (
    <>
      <DataTable
        data={clients}
        columns={columns}
        actions={[
          {
            icon: <Eye className="h-4 w-4" />,
            label: "Visualizza",
            onClick: (client) => setViewingClient(client)
          },
          ...(onEdit ? [{
            icon: <Edit2 className="h-4 w-4" />,
            label: "Modifica",
            onClick: onEdit
          }] : []),
          ...(onDelete ? [{
            icon: <Trash2 className="h-4 w-4" />,
            label: "Elimina",
            onClick: handleDeleteClient,
            variant: "destructive" as const
          }] : [])
        ]}
        getRowKey={(client) => client.id}
      />

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
});

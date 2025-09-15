
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/updated-button";
import { Building, User, Phone, Mail, Edit2, Trash2, Eye } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import { type Client } from "@/services";
import { ClientDetailsDialog } from "./ClientDetailsDialog";
import { format } from "date-fns";

interface ClientsListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export const ClientsList = ({ clients, onEdit, onDelete }: ClientsListProps) => {
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Client>();

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
        title: "Delete Client",
        message: `Are you sure you want to delete "${getClientDisplayName(client)}"? This action cannot be undone.`,
        onConfirm: () => onDelete(client)
      });
    }
  };

  // Define table columns for desktop view
  const columns = [
    {
      key: 'name' as keyof Client,
      header: 'Client',
      render: (value: any, client: Client) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${client.type === "business" ? "bg-purple-100" : "bg-blue-100"}`}>
            {client.type === "business" ? (
              <Building className="h-4 w-4 text-purple-600" />
            ) : (
              <User className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <div className="font-medium">{getClientDisplayName(client)}</div>
            {client.type === "business" && client.contact_person && (
              <div className="text-sm text-muted-foreground">
                Contact: {client.contact_person}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email' as keyof Client,
      header: 'Contact',
      render: (value: any, client: Client) => (
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
      )
    },
    {
      key: 'type' as keyof Client,
      header: 'Type',
      render: (value: string) => (
        <Badge variant="outline" className={value === 'business' ? 'border-purple-200 text-purple-700' : 'border-blue-200 text-blue-700'}>
          {value === 'business' ? 'B2B' : 'B2C'}
        </Badge>
      )
    },
    {
      key: 'status' as keyof Client,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'created_at' as keyof Client,
      header: 'Created',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm">
          {format(new Date(value), "MMM dd, yyyy")}
        </div>
      )
    }
  ];

  // Define actions
  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "View",
      onClick: () => {}, // Required but not used when renderCustom is provided
      renderCustom: (client: Client) => <ClientDetailsDialog client={client} />
    },
    ...(onEdit && onDelete ? [
      {
        icon: <Edit2 className="h-4 w-4" />,
        label: "Edit",
        onClick: onEdit
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: handleDeleteClient,
        variant: "destructive" as const
      }
    ] : [])
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={clients}
          columns={columns}
          actions={actions}
          getRowKey={(client) => client.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1">
        {clients.map((client) => (
          <DataCard
            key={client.id}
            title={getClientDisplayName(client)}
            subtitle={client.type === "business" && client.contact_person ? `Contact: ${client.contact_person}` : undefined}
            icon={client.type === "business" ? 
              <Building className="h-5 w-5 text-purple-600" /> : 
              <User className="h-5 w-5 text-blue-600" />
            }
            badge={{
              text: client.status.charAt(0).toUpperCase() + client.status.slice(1),
              variant: getStatusColor(client.status) as any
            }}
            headerActions={
              <ClientDetailsDialog 
                client={client} 
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary border border-border/50 bg-background/80 backdrop-blur-sm shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
            }
            fields={[
              {
                label: "Type",
                value: <Badge variant="outline" className={client.type === 'business' ? 'border-purple-200 text-purple-700' : 'border-blue-200 text-blue-700'}>
                  {client.type === 'business' ? 'B2B' : 'B2C'}
                </Badge>
              },
              ...(client.email ? [{
                label: "Email",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {client.email}
                  </div>
                )
              }] : []),
              ...(client.phone ? [{
                label: "Phone",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {client.phone}
                  </div>
                )
              }] : []),
              {
                label: "Created",
                value: format(new Date(client.created_at!), "MMM dd, yyyy")
              }
            ]}
            actions={[
              ...(onEdit && onDelete ? [
                {
                  icon: <Edit2 className="h-3 w-3 mr-1" />,
                  label: "Edit",
                  onClick: () => onEdit(client)
                },
                {
                  icon: <Trash2 className="h-3 w-3 mr-1" />,
                  label: "Delete",
                  onClick: () => handleDeleteClient(client),
                  variant: "outlined" as const,
                  className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                }
              ] : [])
            ]}
          />
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={confirmAction}
        title={dialogState.title}
        message={dialogState.message}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
};

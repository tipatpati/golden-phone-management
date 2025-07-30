import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone, Edit2, Trash2, MessageCircle } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog, LoadingState } from "@/components/common";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { ContactSupplierDialog } from "./ContactSupplierDialog";
import { useSuppliers } from "@/services";

interface SuppliersTableProps {
  searchTerm: string;
}

export function SuppliersTable({ searchTerm }: SuppliersTableProps) {
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<any>(null);
  const [contactingSupplier, setContactingSupplier] = useState<any>(null);
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog();
  const { data: suppliers, isLoading } = useSuppliers();

  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteSupplier = (supplier: any) => {
    showConfirmDialog({
      item: supplier,
      title: "Delete Supplier",
      message: `Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`,
      onConfirm: () => setDeletingSupplier(supplier)
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  if (isLoading) {
    return <LoadingState message="Loading suppliers..." />;
  }

  // Define table columns for desktop view
  const columns = [
    {
      key: 'name' as keyof any,
      header: 'Supplier',
      render: (value: string, supplier: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <Building className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            {supplier.contact_person && (
              <div className="text-sm text-muted-foreground">
                Contact: {supplier.contact_person}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'email' as keyof any,
      header: 'Contact',
      render: (value: any, supplier: any) => (
        <div className="space-y-1">
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {supplier.email}
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {supplier.phone}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status' as keyof any,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    }
  ];

  // Define actions
  const actions = [
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: "Contact",
      onClick: (supplier: any) => setContactingSupplier(supplier)
    },
    {
      icon: <Edit2 className="h-4 w-4" />,
      label: "Edit",
      onClick: (supplier: any) => setEditingSupplier(supplier)
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      onClick: handleDeleteSupplier,
      variant: "destructive" as const
    }
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={filteredSuppliers}
          columns={columns}
          actions={actions}
          getRowKey={(supplier) => supplier.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1">
        {filteredSuppliers.map((supplier) => (
          <DataCard
            key={supplier.id}
            title={supplier.name}
            subtitle={supplier.contact_person}
            icon={<Building className="h-5 w-5 text-blue-600" />}
            badge={{
              text: supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1),
              variant: getStatusColor(supplier.status) as any
            }}
            fields={[
              ...(supplier.email ? [{
                label: "Email",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {supplier.email}
                  </div>
                )
              }] : []),
              ...(supplier.phone ? [{
                label: "Phone",
                value: (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {supplier.phone}
                  </div>
                )
              }] : [])
            ]}
            actions={[
              {
                icon: <MessageCircle className="h-3 w-3 mr-1" />,
                label: "Contact",
                onClick: () => setContactingSupplier(supplier)
              },
              {
                icon: <Edit2 className="h-3 w-3 mr-1" />,
                label: "Edit",
                onClick: () => setEditingSupplier(supplier)
              },
              {
                icon: <Trash2 className="h-3 w-3 mr-1" />,
                label: "Delete",
                onClick: () => handleDeleteSupplier(supplier),
                variant: "outline",
                className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              }
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

      <EditSupplierDialog
        supplier={editingSupplier}
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
      />

      <DeleteSupplierDialog
        supplier={deletingSupplier}
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
      />

      <ContactSupplierDialog
        supplier={contactingSupplier}
        open={!!contactingSupplier}
        onOpenChange={(open) => !open && setContactingSupplier(null)}
      />
    </>
  );
}
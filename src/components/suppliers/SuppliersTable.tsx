import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone, Edit2, Trash2, MessageCircle, Eye, Package } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog, LoadingState } from "@/components/common";
import { EditSupplierDialog } from "./EditSupplierDialog";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import { ContactSupplierDialog } from "./ContactSupplierDialog";
import { SupplierDetailsDialog } from "./SupplierDetailsDialog";
import { SupplierProductsDialog } from "./dialogs/SupplierProductsDialog";
import { useSuppliers } from "@/services";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

interface SuppliersTableProps {
  searchTerm: string;
}

export function SuppliersTable({ searchTerm }: SuppliersTableProps) {
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<any>(null);
  const [contactingSupplier, setContactingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [viewingProducts, setViewingProducts] = useState<any>(null);
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog();
  const { data: suppliers, isLoading, refetch } = useSuppliers();

  // Type cast the data array
  const suppliersArray = (suppliers as any[]) || [];
  const filteredSuppliers = suppliersArray.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // CRITICAL: Mobile pagination MUST be called before any early returns to avoid hook violations
  const {
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    paginatedData: paginatedMobileSuppliers,
    goToPage: mobileGoToPage
  } = usePagination({ data: filteredSuppliers, itemsPerPage: 17 });

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

  // Early return AFTER all hooks have been called
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
      icon: <Eye className="h-4 w-4" />,
      label: "View Details",
      onClick: (supplier: any) => {
        console.log('SuppliersTable: View Details clicked for supplier:', supplier.id);
        setViewingSupplier(supplier);
      }
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: "View Products",
      onClick: (supplier: any) => {
        console.log('SuppliersTable: View Products clicked for supplier:', supplier.id);
        setViewingProducts(supplier);
      }
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: "Contact",
      onClick: (supplier: any) => {
        console.log('SuppliersTable: Contact clicked for supplier:', supplier.id);
        setContactingSupplier(supplier);
      }
    },
    {
      icon: <Edit2 className="h-4 w-4" />,
      label: "Edit",
      onClick: (supplier: any) => {
        console.log('SuppliersTable: Edit clicked for supplier:', supplier.id);
        setEditingSupplier(supplier);
      }
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      onClick: (supplier: any) => {
        console.log('SuppliersTable: Delete clicked for supplier:', supplier.id);
        handleDeleteSupplier(supplier);
      },
      variant: "destructive" as const
    }
  ];

  const handleSuccess = () => {
    refetch();
    setViewingSupplier(null);
    setEditingSupplier(null);
    setDeletingSupplier(null);
    setContactingSupplier(null);
  };

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
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1">
          {paginatedMobileSuppliers.map((supplier) => (
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
                icon: <Eye className="h-3 w-3 mr-1" />,
                label: "View",
                onClick: () => {
                  console.log('Mobile View clicked for supplier:', supplier.id);
                  setViewingSupplier(supplier);
                }
              },
              {
                icon: <MessageCircle className="h-3 w-3 mr-1" />,
                label: "Contact",
                onClick: () => {
                  console.log('Mobile Contact clicked for supplier:', supplier.id);
                  setContactingSupplier(supplier);
                }
              },
              {
                icon: <Edit2 className="h-3 w-3 mr-1" />,
                label: "Edit",
                onClick: () => {
                  console.log('Mobile Edit clicked for supplier:', supplier.id);
                  setEditingSupplier(supplier);
                }
              },
              {
                icon: <Trash2 className="h-3 w-3 mr-1" />,
                label: "Delete",
                onClick: () => {
                  console.log('Mobile Delete clicked for supplier:', supplier.id);
                  handleDeleteSupplier(supplier);
                },
                variant: "outlined",
                className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              }
            ]}
          />
        ))}
        </div>
        
        {/* Mobile Pagination */}
        {filteredSuppliers.length > 0 && (
          <TablePagination
            currentPage={mobilePage}
            totalPages={mobileTotalPages}
            onPageChange={mobileGoToPage}
            pageSize={17}
            totalItems={filteredSuppliers.length}
          />
        )}
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

      <SupplierDetailsDialog
        supplier={viewingSupplier}
        open={!!viewingSupplier}
        onOpenChange={(open) => !open && setViewingSupplier(null)}
        onToggleStatus={handleSuccess}
      />

      <SupplierProductsDialog
        supplier={viewingProducts}
        open={!!viewingProducts}
        onOpenChange={(open) => !open && setViewingProducts(null)}
      />

      <EditSupplierDialog
        supplier={editingSupplier}
        open={!!editingSupplier}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSupplier(null);
            refetch();
          }
        }}
      />

      <DeleteSupplierDialog
        supplier={deletingSupplier}
        open={!!deletingSupplier}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSupplier(null);
            refetch();
          }
        }}
      />

      <ContactSupplierDialog
        supplier={contactingSupplier}
        open={!!contactingSupplier}
        onOpenChange={(open) => !open && setContactingSupplier(null)}
      />

      <SupplierProductsDialog
        supplier={viewingProducts}
        open={!!viewingProducts}
        onOpenChange={(open) => !open && setViewingProducts(null)}
      />
    </>
  );
}
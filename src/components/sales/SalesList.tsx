import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, User, CreditCard, CalendarDays, Edit2, Trash2, Eye } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import type { Sale } from "@/services/sales";
import { SaleDetailsDialog } from "./SaleDetailsDialog";
import { BulkSalesActionsToolbar } from "./BulkSalesActionsToolbar";
import { useDeleteSale } from "@/services/sales/SalesReactQueryService";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface SalesListProps {
  sales: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  onViewDetails?: (sale: Sale) => void;
}

export function SalesList({ sales, onEdit, onDelete, onViewDetails }: SalesListProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Sale>();
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  const deleteSaleMutation = useDeleteSale();

  const isSelectionMode = userRole === 'super_admin';
  const selectedSalesArray = sales.filter(sale => selectedSales.has(sale.id));

  const handleSelectSale = (saleId: string, checked: boolean) => {
    const newSelected = new Set(selectedSales);
    if (checked) {
      newSelected.add(saleId);
    } else {
      newSelected.delete(saleId);
    }
    setSelectedSales(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSales(new Set(sales.map(sale => sale.id)));
    } else {
      setSelectedSales(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedSales(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedSales.size === 0) return;
    
    const deletedCount = selectedSales.size;
    const selectedIds = Array.from(selectedSales);
    
    try {
      toast({
        title: "Deleting sales...",
        description: `Deleting ${deletedCount} sales and restoring inventory...`,
      });

      // Delete sales one by one (each deletion will restore inventory via database triggers)
      const promises = selectedIds.map(async (saleId) => {
        try {
          await deleteSaleMutation.mutateAsync(saleId);
          console.log(`Successfully deleted sale: ${saleId}`);
        } catch (error) {
          console.error(`Failed to delete sale ${saleId}:`, error);
          throw error;
        }
      });
      
      // Wait for all deletions to complete
      await Promise.all(promises);
      
      // Clear selection after successful deletion
      setSelectedSales(new Set());
      
      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Sales deleted successfully",
        description: `Successfully deleted ${deletedCount} sales. Inventory has been restored automatically.`,
      });
      
      console.log(`Successfully bulk deleted ${deletedCount} sales`);
      
    } catch (error) {
      console.error('Error during bulk delete:', error);
      
      toast({
        title: "Error deleting sales",
        description: "Some sales could not be deleted. Please try again.",
        variant: "destructive",
      });
      
      throw error; // Re-throw to show error in UI
    }
  };

  const handleDeleteSale = (sale: Sale) => {
    if (onDelete) {
      showConfirmDialog({
        item: sale,
        title: "Delete Sale",
        message: `Are you sure you want to delete sale #${sale.sale_number}? This action cannot be undone.`,
        onConfirm: () => onDelete(sale)
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Define table columns for desktop view
  const columns = [
    ...(isSelectionMode ? [{
      key: 'select' as keyof Sale,
      header: '',
      render: (value: any, sale: Sale) => (
        <Checkbox
          checked={selectedSales.has(sale.id)}
          onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
        />
      )
    }] : []),
    {
      key: 'sale_number' as keyof Sale,
      header: 'Sale #',
      render: (value: string) => (
        <div className="font-mono font-medium">#{value}</div>
      )
    },
    {
      key: 'salesperson' as keyof Sale,
      header: 'Salesperson',
      render: (value: any) => typeof value === 'object' ? value.username || "Unknown" : value || "Unknown"
    },
    {
      key: 'total_amount' as keyof Sale,
      header: 'Amount',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-medium">€{value.toFixed(2)}</div>
      )
    },
    {
      key: 'payment_method' as keyof Sale,
      header: 'Payment',
      render: (value: string) => (
        <Badge variant="outline">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'status' as keyof Sale,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'sale_date' as keyof Sale,
      header: 'Data',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm">
          {format(new Date(value), "dd/MM/yyyy")}
        </div>
      )
    }
  ];

  // Define actions
  const actions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "Dettagli",
      onClick: () => {}, // Required but not used when renderCustom is provided
      renderCustom: (sale: Sale) => (
        <SaleDetailsDialog 
          sale={sale}
          trigger={
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </Button>
          }
        />
      )
    },
    ...(onEdit && onDelete ? [
      {
        icon: <Edit2 className="h-4 w-4" />,
        label: "Modifica",
        onClick: onEdit,
        className: "hover:bg-amber-50 hover:text-amber-600"
      },
      {
        icon: <Trash2 className="h-4 w-4" />,
        label: "Elimina",
        onClick: handleDeleteSale,
        variant: "destructive" as const,
        className: "hover:bg-red-50 hover:text-red-600"
      }
    ] : [])
  ];

  return (
    <>
      {/* Bulk Actions Toolbar */}
      <BulkSalesActionsToolbar
        selectedCount={selectedSales.size}
        selectedSales={selectedSalesArray}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        isLoading={deleteSaleMutation.isPending}
        className="mb-4"
      />

      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        {isSelectionMode && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedSales.size === sales.length && sales.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all sales
              </span>
            </div>
          </div>
        )}
        <DataTable
          data={sales}
          columns={columns}
          actions={actions}
          getRowKey={(sale) => sale.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1">
        {sales.map((sale) => (
          <div key={sale.id} className="relative">
            {isSelectionMode && (
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedSales.has(sale.id)}
                  onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
                  className="bg-background border-2"
                />
              </div>
            )}
            <DataCard
              key={sale.id}
              title={`Sale #${sale.sale_number}`}
              subtitle={typeof sale.salesperson === 'object' ? sale.salesperson.username || "Unknown" : sale.salesperson || "Unknown Salesperson"}
              icon={<Receipt className="h-5 w-5 text-primary" />}
              badge={{
                text: sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
                variant: getStatusColor(sale.status) as any
              }}
            headerActions={
              <SaleDetailsDialog 
                sale={sale} 
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-border/30 bg-background/50 backdrop-blur-sm shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />
            }
            fields={[
              {
                label: "Amount",
                value: <span className="text-base font-bold text-primary">€{sale.total_amount.toFixed(2)}</span>,
                className: "text-lg font-bold text-primary"
              },
              {
                label: "Payment",
                value: (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                  </div>
                )
              },
              {
                label: "Data",
                value: (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(sale.sale_date), "dd/MM/yyyy")}
                  </div>
                )
              }
            ]}
            actions={[
              ...(onEdit && onDelete ? [
                {
                  icon: <Edit2 className="h-3 w-3 mr-1" />,
                  label: "Modifica",
                  onClick: () => onEdit(sale),
                  className: "hover:bg-amber-50 hover:text-amber-600 border-amber-200/50"
                },
                {
                  icon: <Trash2 className="h-3 w-3 mr-1" />,
                  label: "Elimina",
                  onClick: () => handleDeleteSale(sale),
                  variant: "outline" as const,
                  className: "text-red-600 hover:text-red-700 border-red-200/50 hover:bg-red-50"
                }
              ] : [])
            ]}
            />
          </div>
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
}
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, User, CreditCard, CalendarDays, Edit2, Trash2, Eye, Printer, Package, Euro, Clock, MapPin, Phone, Mail } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import type { Sale } from "@/services/sales";
import { SaleDetailsDialog } from "./SaleDetailsDialog";
import { ControlledSaleDetailsDialog } from "./ControlledSaleDetailsDialog";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { BulkSalesActionsToolbar } from "./BulkSalesActionsToolbar";
import { useDeleteSale } from "@/services/sales/SalesReactQueryService";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

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
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
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

  // Mobile pagination
  const {
    paginatedData: paginatedMobileSales,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: sales, itemsPerPage: 17 });

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
          logger.info('Successfully deleted sale', { saleId }, 'SalesList');
        } catch (error) {
          logger.error('Failed to delete sale', { saleId, error }, 'SalesList');
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
      
      logger.info('Successfully bulk deleted sales', { count: deletedCount }, 'SalesList');
      
    } catch (error) {
      logger.error('Error during bulk delete', { error }, 'SalesList');
      
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
        <div className="flex items-center justify-center">
          <Checkbox
            checked={selectedSales.has(sale.id)}
            onCheckedChange={(checked) => handleSelectSale(sale.id, checked as boolean)}
          />
        </div>
      )
    }] : []),
    {
      key: 'sale_number' as keyof Sale,
      header: 'Sale #',
      render: (value: string) => (
        <div className="font-mono font-medium text-sm whitespace-nowrap">#{value}</div>
      )
    },
    {
      key: 'client' as keyof Sale,
      header: 'Cliente',
      render: (value: any) => {
        if (!value) return <span className="text-muted-foreground text-sm">N/A</span>;
        const name = value.type === 'business' 
          ? value.company_name 
          : `${value.first_name || ''} ${value.last_name || ''}`.trim();
        return (
          <div className="text-sm truncate max-w-[150px]" title={name || 'N/A'}>
            {name || 'N/A'}
          </div>
        );
      }
    },
    {
      key: 'salesperson' as keyof Sale,
      header: 'Venditore',
      render: (value: any) => {
        const username = typeof value === 'object' && value ? value.username || "Unknown" : value || "Unknown";
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-sm">{username}</span>
          </div>
        );
      }
    },
    {
      key: 'sale_items' as keyof Sale,
      header: 'Prodotti',
      render: (value: any[]) => {
        const itemCount = value?.length || 0;
        if (itemCount === 0) return <span className="text-muted-foreground text-sm">-</span>;
        
        const firstItem = value[0];
        const productName = firstItem.product 
          ? `${firstItem.product.brand || ''} ${firstItem.product.model || ''}`.trim()
          : 'Unknown';
        
        return (
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">{itemCount} prodott{itemCount === 1 ? 'o' : 'i'}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {productName}{itemCount > 1 ? ` +${itemCount - 1}` : ''}
            </div>
          </div>
        );
      }
    },
    {
      key: 'total_amount' as keyof Sale,
      header: 'Totale',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-bold text-primary text-base whitespace-nowrap">€{value.toFixed(2)}</div>
      )
    },
    {
      key: 'payment_method' as keyof Sale,
      header: 'Pagamento',
      render: (value: string, sale: Sale) => (
        <div className="min-w-0 w-full">
          <div className="text-sm font-medium capitalize whitespace-nowrap">{value}</div>
          {value === 'hybrid' && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {sale.cash_amount > 0 && <div className="whitespace-nowrap">Cash: €{sale.cash_amount.toFixed(2)}</div>}
              {sale.card_amount > 0 && <div className="whitespace-nowrap">Card: €{sale.card_amount.toFixed(2)}</div>}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status' as keyof Sale,
      header: 'Stato',
      align: 'center' as const,
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      )
    },
    {
      key: 'sale_date' as keyof Sale,
      header: 'Data & Ora',
      align: 'right' as const,
      render: (value: string) => (
        <div className="text-sm text-right">
          <div className="font-medium whitespace-nowrap">{format(new Date(value), "dd/MM/yyyy")}</div>
          <div className="text-muted-foreground text-xs whitespace-nowrap">{format(new Date(value), "HH:mm")}</div>
        </div>
      )
    }
  ];

  // Define actions - enhanced with print receipt and view details
  const actions = [
    {
      icon: <Printer className="h-4 w-4" />,
      label: "Stampa",
      onClick: (sale: Sale) => setSelectedSaleForReceipt(sale),
      className: "hover:bg-green-50 hover:text-green-600"
    },
    {
      icon: <Eye className="h-4 w-4" />,
      label: "Dettagli",
      onClick: (sale: Sale) => setSelectedSaleForDetails(sale),
      className: "hover:bg-blue-50 hover:text-blue-600"
    },
    ...(onEdit ? [
      {
        icon: <Edit2 className="h-4 w-4" />,
        label: "Modifica",
        onClick: onEdit,
        className: "hover:bg-amber-50 hover:text-amber-600"
      }
    ] : []),
    ...(onDelete ? [
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
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1">
          {paginatedMobileSales.map((sale) => (
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
              subtitle={(typeof sale.salesperson === 'object' && sale.salesperson ? sale.salesperson.username || "Unknown" : sale.salesperson || "Unknown Salesperson") as string}
              icon={<Receipt className="h-5 w-5 text-primary" />}
              badge={{
                text: sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
                variant: getStatusColor(sale.status) as any
              }}
            headerActions={
              onEdit ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(sale)}
                  className="h-8 w-8 p-0 hover:bg-amber-50 hover:text-amber-600 transition-colors border border-border/30 bg-background/50 backdrop-blur-sm shadow-sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : null
            }
            fields={[
              {
                label: "Cliente",
                value: (() => {
                  const client = sale.client;
                  if (!client) return <span className="text-muted-foreground">Cliente Anonimo</span>;
                  const name = client.type === 'business' 
                    ? client.company_name 
                    : `${client.first_name || ''} ${client.last_name || ''}`.trim();
                  return (
                    <div className="space-y-1">
                      <div className="font-medium">{name || 'Cliente Anonimo'}</div>
                      {client.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                      )}
                    </div>
                  );
                })()
              },
              {
                label: "Prodotti",
                value: (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {sale.sale_items?.length || 0} {sale.sale_items?.length === 1 ? 'prodotto' : 'prodotti'}
                      </span>
                    </div>
                    {sale.sale_items && sale.sale_items.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {sale.sale_items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.product?.brand} {item.product?.model}</span>
                            <span>€{item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                        {sale.sale_items.length > 2 && <div>+{sale.sale_items.length - 2} altri prodotti...</div>}
                      </div>
                    )}
                  </div>
                )
              },
              {
                label: "Totale",
                value: <span className="text-base font-bold text-primary">€{sale.total_amount.toFixed(2)}</span>,
                className: "text-lg font-bold text-primary"
              },
              {
                label: "Pagamento",
                value: (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                    </div>
                    {sale.payment_method === 'hybrid' && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {sale.cash_amount > 0 && <div>Contanti: €{sale.cash_amount.toFixed(2)}</div>}
                        {sale.card_amount > 0 && <div>Carta: €{sale.card_amount.toFixed(2)}</div>}
                      </div>
                    )}
                  </div>
                )
              },
              {
                label: "Data & Ora",
                value: (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(sale.sale_date), "dd/MM/yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(sale.sale_date), "HH:mm")}
                    </div>
                  </div>
                )
              },
              {
                label: "Venditore",
                value: (
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {(typeof sale.salesperson === 'object' && sale.salesperson ? sale.salesperson.username || "Unknown" : sale.salesperson || "Unknown") as string}
                  </div>
                )
              }
            ]}
            actions={[
              {
                icon: <Printer className="h-3 w-3 mr-1" />,
                label: "Stampa",
                onClick: () => setSelectedSaleForReceipt(sale),
                className: "hover:bg-green-50 hover:text-green-600 border-green-200/50"
              },
              ...(!onEdit ? [
                {
                  icon: <Eye className="h-3 w-3 mr-1" />,
                  label: "Dettagli",
                  onClick: () => setSelectedSaleForDetails(sale),
                  className: "hover:bg-blue-50 hover:text-blue-600 border-blue-200/50"
                }
              ] : []),
              ...(onDelete ? [
                {
                  icon: <Trash2 className="h-3 w-3 mr-1" />,
                  label: "Elimina",
                  onClick: () => handleDeleteSale(sale),
                  variant: "outlined" as const,
                  className: "text-red-600 hover:text-red-700 border-red-200/50 hover:bg-red-50"
                }
              ] : [])
            ]}
            />
          </div>
        ))}
        </div>
        
        {/* Mobile Pagination */}
        {sales.length > 0 && (
          <TablePagination
            currentPage={mobilePage}
            totalPages={mobileTotalPages}
            onPageChange={mobileGoToPage}
            pageSize={17}
            totalItems={sales.length}
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

      {/* Sale Details Dialog */}
      {selectedSaleForDetails && (
        <ControlledSaleDetailsDialog 
          sale={selectedSaleForDetails}
          open={true}
          onClose={() => setSelectedSaleForDetails(null)}
        />
      )}

      {/* Receipt Print Dialog */}
      {selectedSaleForReceipt && (
        <SaleReceiptDialog 
          sale={selectedSaleForReceipt}
          open={true}
          onOpenChange={(open) => !open && setSelectedSaleForReceipt(null)}
        />
      )}
    </>
  );
}
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, User, CreditCard, CalendarDays, Edit2, Trash2, Eye, Printer, Package, Euro, Clock, MapPin, Phone, Mail } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import type { Sale } from "@/services/sales";
import { SaleDetailsDialog } from "./SaleDetailsDialog";
import { ControlledSaleDetailsDialog } from "./ControlledSaleDetailsDialog";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { ComprehensiveEditSaleDialog } from "./ComprehensiveEditSaleDialog";
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
  searchTerm?: string;
}

export function SalesList({ sales, onEdit, onDelete, onViewDetails, searchTerm }: SalesListProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Sale>();
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());
  const deleteSaleMutation = useDeleteSale();

  // Auto-expand sales with matching products when search is active
  React.useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const salesWithMatches = new Set<string>();
      sales.forEach(sale => {
        const hasMatchingItem = sale.sale_items?.some(item => itemMatchesSearch(item));
        if (hasMatchingItem) {
          salesWithMatches.add(sale.id);
        }
      });
      setExpandedSales(salesWithMatches);
    } else {
      setExpandedSales(new Set());
    }
  }, [searchTerm, sales]);

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

  // Helper to check if an item matches the search term
  const itemMatchesSearch = (item: any): boolean => {
    if (!searchTerm || !searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    const productName = `${item.product?.brand || ''} ${item.product?.model || ''}`.toLowerCase();
    const serialNumber = (item.serial_number || '').toLowerCase();
    return productName.includes(term) || serialNumber.includes(term);
  };

  // Toggle expanded state for a sale
  const toggleExpanded = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
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
      render: (value: any[], sale: Sale) => {
        const itemCount = value?.length || 0;
        if (itemCount === 0) return <span className="text-muted-foreground text-sm">-</span>;
        
        const matchedItems = value.filter(item => itemMatchesSearch(item));
        const hasMatch = matchedItems.length > 0;
        const isExpanded = expandedSales.has(sale.id);
        
        return (
          <div className="min-w-0 w-full">
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(sale.id);
              }}
            >
              <Package className={`h-3.5 w-3.5 flex-shrink-0 ${hasMatch ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium whitespace-nowrap ${hasMatch ? 'text-primary' : ''}`}>
                {itemCount} prodott{itemCount === 1 ? 'o' : 'i'}
                {hasMatch && ` (${matchedItems.length})`}
              </span>
              {itemCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </div>
            
            {/* Expanded matched items for desktop */}
            {isExpanded && hasMatch && (
              <div className="mt-2 space-y-1 p-2 bg-primary/5 border border-primary/20 rounded max-w-md">
                {matchedItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-1.5 bg-background border border-primary/30 rounded text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-primary">
                          ✓ {item.product?.brand} {item.product?.model}
                        </div>
                        {item.serial_number && (
                          <div className="text-muted-foreground font-mono mt-0.5">
                            {item.serial_number}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-primary whitespace-nowrap">
                        €{item.total_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Compact view when not expanded */}
            {!isExpanded && (
              <div className={`text-xs truncate mt-0.5 ${hasMatch ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {hasMatch && <span className="text-primary">✓ </span>}
                {value[0].product 
                  ? `${value[0].product.brand || ''} ${value[0].product.model || ''}`.trim()
                  : 'Unknown'}{itemCount > 1 ? ` +${itemCount - 1}` : ''}
              </div>
            )}
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
    ...(userRole === 'super_admin' ? [
      {
        icon: <Edit2 className="h-4 w-4" />,
        label: "Modifica",
        onClick: () => {}, // Not used because of renderCustom
        className: "hover:bg-amber-50 hover:text-amber-600",
        renderCustom: (sale: Sale) => (
          <ComprehensiveEditSaleDialog sale={sale} />
        )
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
          onRowClick={(sale) => setSelectedSaleForDetails(sale)}
        />
      </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {paginatedMobileSales.map((sale) => {
            const matchedItems = sale.sale_items?.filter(item => itemMatchesSearch(item)) || [];
            const hasMatch = matchedItems.length > 0;
            const isExpanded = expandedSales.has(sale.id);
            
            return (
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
                  icon={<Receipt className={`h-5 w-5 ${hasMatch ? 'text-primary' : 'text-primary'}`} />}
                  badge={{
                    text: sale.status.charAt(0).toUpperCase() + sale.status.slice(1),
                    variant: getStatusColor(sale.status) as any
                  }}
                  headerActions={
                    userRole === 'super_admin' ? (
                      <ComprehensiveEditSaleDialog sale={sale} />
                    ) : null
                  }
                  onClick={() => setSelectedSaleForDetails(sale)}
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
                      value: (() => {
                        const items = sale.sale_items || [];
                        const displayItems = hasMatch ? matchedItems : items.slice(0, 2);
                        
                        return (
                          <div className="space-y-2">
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(sale.id);
                              }}
                            >
                              <Package className={`h-3 w-3 ${hasMatch ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-sm font-medium ${hasMatch ? 'text-primary' : ''}`}>
                                {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
                                {hasMatch && ` (${matchedItems.length} corrispond${matchedItems.length === 1 ? 'e' : 'ono'})`}
                              </span>
                              {items.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              )}
                            </div>
                            
                            {/* Expanded matched items */}
                            {isExpanded && hasMatch && (
                              <div className="ml-4 space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  Prodotti Trovati
                                </div>
                                {matchedItems.map((item, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-2 bg-background border border-primary/30 rounded"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-primary text-sm">
                                          ✓ {item.product?.brand} {item.product?.model}
                                        </div>
                                        {item.serial_number && (
                                          <div className="text-xs text-muted-foreground font-mono mt-1">
                                            IMEI: {item.serial_number}
                                          </div>
                                        )}
                                        {item.product?.year && (
                                          <div className="text-xs text-muted-foreground mt-0.5">
                                            Anno: {item.product.year}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-primary">
                                          €{item.total_price.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Qtà: {item.quantity}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Regular item display */}
                            {!isExpanded && items.length > 0 && (
                              <div className="text-xs space-y-0.5">
                                {displayItems.map((item, idx) => {
                                  const isMatched = itemMatchesSearch(item);
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex justify-between ${isMatched ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                                    >
                                      <span className="truncate">
                                        {isMatched && '✓ '}
                                        {item.product?.brand} {item.product?.model}
                                        {item.serial_number && ` (${item.serial_number.slice(-4)})`}
                                      </span>
                                      <span>€{item.total_price.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                                {!hasMatch && items.length > 2 && (
                                  <div className="text-muted-foreground">+{items.length - 2} altri prodotti...</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
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
            );
          })}
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
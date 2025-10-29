import React from "react";
import type { Sale } from "@/services/sales/types";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesStats } from "@/components/sales/SalesStats";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";
import { SalesSearchBar } from "@/components/sales/SalesSearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { roleUtils } from "@/utils/roleUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/common/PageLayout";
import { AlertCircle } from "lucide-react";
import { useSales } from "@/services/sales/SalesReactQueryService";
import { useSalesSearch } from "@/hooks/useSalesSearch";
import { SalesDataService } from "@/services/sales/SalesDataService";
import { SalesAnalyticsDashboard } from "@/components/sales/SalesAnalyticsDashboard";
import { EnhancedSalesFilters, type SalesFilters } from "@/components/sales/EnhancedSalesFilters";
import { useSalesMonitoring } from "@/components/sales/SalesMonitoringService";
import { AdvancedEditSaleDialog } from "@/components/sales/AdvancedEditSaleDialog";
import { EnhancedDeleteDialog } from "@/components/sales/EnhancedDeleteDialog";
import { BulkEditSaleDialog } from "@/components/sales/BulkEditSaleDialog";
import { StoreContextStatus } from "@/components/sales/StoreContextStatus";
import { useQueryClient } from "@tanstack/react-query";

const Garanzia = () => {
  const { userRole } = useAuth();
  const { trackInteraction } = useSalesMonitoring();
  const [filters, setFilters] = React.useState<SalesFilters>({});
  const [showAnalytics, setShowAnalytics] = React.useState(false);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = React.useState<Sale | null>(null);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = React.useState<Sale | null>(null);
  const [showBulkEdit, setShowBulkEdit] = React.useState(false);
  const [selectedSales, setSelectedSales] = React.useState<Sale[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = React.useState("");
  
  // Separate search and filters (matching inventory pattern)
  const { searchQuery, searchTrigger, isSearching, executeSearch, clearSearch, completeSearch } = useSalesSearch();
  const queryClient = useQueryClient();
  const { data: salesData = [], isLoading, error, refetch } = useSales(searchQuery);
  
  // Ensure garanzia is always an array
  const garanzia = Array.isArray(salesData) ? salesData : [];
  
  // Sync local search term with query changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Force refetch when search is triggered (matching inventory pattern)
  React.useEffect(() => {
    if (searchTrigger > 0) {
      refetch().then(() => {
        completeSearch();
      });
    }
  }, [searchTrigger, refetch, completeSearch]);
  
  // Check if user is super admin to see analytics
  const canViewAnalytics = userRole === 'super_admin';
  
  // Filter sales based on active filters
  const filteredGaranzia = React.useMemo(() => {
    let filtered = garanzia;
    
    if (filters.dateFrom) {
      filtered = filtered.filter(sale => new Date(sale.created_at) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(sale => new Date(sale.created_at) <= endDate);
    }
    if (filters.status) {
      filtered = filtered.filter(sale => sale.status === filters.status);
    }
    if (filters.paymentMethod) {
      filtered = filtered.filter(sale => sale.payment_method === filters.paymentMethod);
    }
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(sale => sale.total_amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(sale => sale.total_amount <= filters.maxAmount!);
    }
    
    return filtered;
  }, [garanzia, filters]);
  
  // Track page view
  React.useEffect(() => {
    trackInteraction('page_view', { page: 'sales' });
  }, [trackInteraction]);
  
  // Format sales data for display
  const formattedGaranzia = filteredGaranzia.map(sale => 
    SalesDataService.formatSaleForDisplay(sale)
  );
  
  const resetFilters = () => {
    setFilters({});
    trackInteraction('filters_reset');
  };

  // Enhanced CRUD handlers for super admin
  const handleEditSale = (sale: Sale) => {
    setSelectedSaleForEdit(sale);
    trackInteraction('edit_sale', { saleId: sale.id });
  };

  const handleDeleteSale = (sale: Sale) => {
    setSelectedSaleForDelete(sale);
    trackInteraction('delete_sale_attempt', { saleId: sale.id });
  };

  const handleBulkEdit = (sales: Sale[]) => {
    setSelectedSales(sales);
    setShowBulkEdit(true);
    trackInteraction('bulk_edit_open', { count: sales.length });
  };

  const handleEditSuccess = () => {
    setSelectedSaleForEdit(null);
    trackInteraction('edit_sale_success');
  };

  const handleDeleteSuccess = () => {
    setSelectedSaleForDelete(null);
    trackInteraction('delete_sale_success');
  };

  const handleBulkEditSuccess = () => {
    setShowBulkEdit(false);
    setSelectedSales([]);
    trackInteraction('bulk_edit_success');
  };

  const handleSearch = () => {
    executeSearch(localSearchQuery);
    trackInteraction('search', { query: localSearchQuery });
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    clearSearch();
    trackInteraction('search_clear');
  };

  if (isLoading && !garanzia.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center">
              <h3 className="font-semibold">Errore nel caricamento</h3>
              <p className="text-sm text-muted-foreground">
                Impossibile caricare le garanzie. Riprova più tardi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      <SalesHeader />
      
      {/* Store Context Status Indicator */}
      <StoreContextStatus />
      
      <ModuleNavCards currentModule="sales" />
      
      {/* Enhanced Filters */}
      <EnhancedSalesFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
        isLoading={isLoading}
      />
      
      {/* Analytics Dashboard for admin users */}
      {canViewAnalytics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Analytics</h3>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Nascondi' : 'Mostra'} Analytics
            </Button>
          </div>
          
          {showAnalytics ? (
            <SalesAnalyticsDashboard sales={filteredGaranzia} isLoading={isLoading} />
          ) : (
            <SalesStats sales={filteredGaranzia} />
          )}
        </div>
      )}
      
      <SalesSearchBar 
        searchTerm={localSearchQuery} 
        onSearchChange={setLocalSearchQuery} 
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isSearching={isSearching}
      />
      
      <SalesList 
        sales={formattedGaranzia} 
        onEdit={userRole === 'super_admin' ? handleEditSale : undefined}
        onDelete={userRole === 'super_admin' ? handleDeleteSale : undefined}
        searchTerm={searchQuery}
      />

      {/* Enhanced CRUD Dialogs */}
      {selectedSaleForEdit && (
        <AdvancedEditSaleDialog
          sale={selectedSaleForEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      {selectedSaleForDelete && (
        <EnhancedDeleteDialog
          sale={selectedSaleForDelete}
          open={!!selectedSaleForDelete}
          onClose={() => setSelectedSaleForDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {showBulkEdit && (
        <BulkEditSaleDialog
          selectedSales={selectedSales}
          open={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          onSuccess={handleBulkEditSuccess}
        />
      )}
    </PageLayout>
  );
};

export default Garanzia;
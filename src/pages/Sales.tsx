import React, { Suspense } from "react";
import { useSales, type Sale } from "@/services";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesStats } from "@/components/sales/SalesStats";
import { SalesNavCards } from "@/components/sales/SalesNavCards";
import { SalesSearchBar } from "@/components/sales/SalesSearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { EmptySalesList } from "@/components/sales/EmptySalesList";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { useErrorHandler } from "@/services/core/ErrorHandlingService";
import { useDebouncedSearch, useOptimizedFilter } from "@/utils/performanceOptimizations";
import { OptimizedLoadingBoundary, StatsSkeleton, TableSkeleton } from "@/components/common/OptimizedLoadingBoundary";
import { useAppPrefetch } from "@/hooks/useAppPrefetch";
import { useAuth } from "@/contexts/AuthContext";
import { roleUtils } from "@/utils/roleUtils";

const Sales = () => {
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch();
  const { data: sales = [], isLoading, error } = useSales(debouncedSearchTerm);
  const { handleError } = useErrorHandler('Sales');
  const { userRole } = useAuth();
  
  // Check if user has admin-level permissions to see analytics
  const canViewAnalytics = userRole && roleUtils.hasPermissionLevel(userRole, 'admin');
  
  // Ensure sales is always an array
  const salesArray = Array.isArray(sales) ? sales : [];

  // Handle error state
  if (error) {
    handleError(error, 'loadSales', false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-3 sm:p-4 lg:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SalesHeader />
        <SalesNavCards />
        
        {/* Only show analytics for admin users */}
        {canViewAnalytics && (
          <OptimizedLoadingBoundary fallback={<StatsSkeleton />}>
            <Suspense fallback={<StatsSkeleton />}>
              <SalesStats sales={salesArray} />
            </Suspense>
          </OptimizedLoadingBoundary>
        )}
        
        <SalesSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        <OptimizedLoadingBoundary fallback={<TableSkeleton />}>
          <EnhancedLoading
            isLoading={isLoading}
            error={error ? error.message : null}
            isEmpty={salesArray.length === 0}
            onRetry={() => window.location.reload()}
            emptyText={searchTerm ? `Nessuna vendita trovata per "${searchTerm}"` : 'Nessuna vendita trovata'}
          >
            <SalesList sales={salesArray} />
          </EnhancedLoading>
        </OptimizedLoadingBoundary>
      </div>
    </div>
  );
};

export default Sales;
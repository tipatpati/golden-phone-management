import React from 'react';
import { ErrorBoundaryWithRetry } from '@/components/common/ErrorBoundaryWithRetry';
import { useErrorHandler } from '@/services/core/ErrorHandlingService';
import { useSales } from '@/services';
import { useSalesSearch } from '@/hooks/useSalesSearch';
import { SalesHeader } from './SalesHeader';
import { SalesStats } from './SalesStats';
import { SalesSearchBar } from './SalesSearchBar';
import { SalesList } from './SalesList';
import { EmptySalesList } from './EmptySalesList';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';

export function SalesWithErrorHandling() {
  const { handleError } = useErrorHandler('Sales');
  const [localSearchQuery, setLocalSearchQuery] = React.useState("");
  const { searchQuery, searchTrigger, isSearching, executeSearch, clearSearch, completeSearch } = useSalesSearch();
  const { data: sales = [], isLoading, error, refetch } = useSales(searchQuery);
  
  // Sync local search term with query changes
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Force refetch when search is triggered
  React.useEffect(() => {
    if (searchTrigger > 0) {
      refetch().then(() => {
        completeSearch();
      });
    }
  }, [searchTrigger, refetch, completeSearch]);
  
  // Ensure sales is always an array
  const salesArray = Array.isArray(sales) ? sales : [];

  // Handle error state
  React.useEffect(() => {
    if (error) {
      handleError(error, 'loadSales', false);
    }
  }, [error, handleError]);

  const handleSalesError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    handleError(error, 'sales_component_error', true);
  }, [handleError]);

  const handleSearch = () => {
    executeSearch(localSearchQuery);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    clearSearch();
  };

  return (
    <ErrorBoundaryWithRetry onError={handleSalesError}>
      <EnhancedLoading
        isLoading={isLoading}
        error={error ? error.message : null}
        isEmpty={salesArray.length === 0}
        onRetry={() => window.location.reload()}
        emptyText={searchQuery ? `No sales found for "${searchQuery}"` : 'No sales found'}
      >
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-3 sm:p-4 lg:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <ErrorBoundaryWithRetry>
              <SalesHeader />
            </ErrorBoundaryWithRetry>
            
            <ErrorBoundaryWithRetry>
              <SalesStats sales={salesArray} />
            </ErrorBoundaryWithRetry>
            
            <ErrorBoundaryWithRetry>
              <SalesSearchBar 
                searchTerm={localSearchQuery} 
                onSearchChange={setLocalSearchQuery}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isSearching={isSearching}
              />
            </ErrorBoundaryWithRetry>
            
            <ErrorBoundaryWithRetry>
              <SalesList sales={salesArray} />
            </ErrorBoundaryWithRetry>
          </div>
        </div>
      </EnhancedLoading>
    </ErrorBoundaryWithRetry>
  );
}
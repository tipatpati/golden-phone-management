import React from "react";
import type { Sale } from "@/services/sales/types";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesStats } from "@/components/sales/SalesStats";
import { SalesNavCards } from "@/components/sales/SalesNavCards";
import { SalesSearchBar } from "@/components/sales/SalesSearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/contexts/AuthContext";
import { roleUtils } from "@/utils/roleUtils";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useDebouncedSalesSearch } from "@/components/sales/hooks/useDebouncedSalesSearch";
import { SalesDataService } from "@/services/sales/SalesDataService";

const Garentille = () => {
  const { userRole } = useAuth();
  const {
    searchTerm,
    setSearchTerm,
    sales: garentille,
    isLoading,
    isSearching,
    error
  } = useDebouncedSalesSearch();
  
  // Check if user has admin-level permissions to see analytics
  const canViewAnalytics = userRole && roleUtils.hasPermissionLevel(userRole, 'admin');
  
  // Format sales data for display
  const formattedGarentille = garentille.map(sale => 
    SalesDataService.formatSaleForDisplay(sale)
  );

  if (isLoading && !garentille.length) {
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
                Impossibile caricare le garentille. Riprova più tardi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-3 sm:p-4 lg:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SalesHeader />
        <SalesNavCards />
        
        {/* Only show analytics for admin users */}
        {canViewAnalytics && (
          <SalesStats sales={garentille} />
        )}
        
        <SalesSearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          isSearching={isSearching}
        />
        
        <SalesList sales={formattedGarentille} />
      </div>
    </div>
  );
};

export default Garentille;
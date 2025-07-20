import React, { useState } from "react";
import { useSales } from "@/services/useSales";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { SalesStats } from "@/components/sales/SalesStats";
import { SalesSearchBar } from "@/components/sales/SalesSearchBar";
import { SalesList } from "@/components/sales/SalesList";
import { EmptySalesList } from "@/components/sales/EmptySalesList";
import { SalesLoadingState } from "@/components/sales/SalesLoadingState";
import { SalesErrorState } from "@/components/sales/SalesErrorState";

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: sales = [], isLoading, error } = useSales(searchTerm);

  if (isLoading) {
    return <SalesLoadingState />;
  }

  if (error) {
    return <SalesErrorState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-3 sm:p-4 lg:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SalesHeader />
        <SalesStats sales={sales} />
        <SalesSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {sales.length === 0 ? (
          <EmptySalesList searchTerm={searchTerm} />
        ) : (
          <SalesList sales={sales} />
        )}
      </div>
    </div>
  );
};

export default Sales;
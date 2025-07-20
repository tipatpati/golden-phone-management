import React from "react";
import { NewSaleDialog } from "./NewSaleDialog";

export function SalesHeader() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sales Management
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl">
            Manage sales transactions, process refunds, and track performance with comprehensive analytics.
          </p>
        </div>
        <div className="flex-shrink-0">
          <NewSaleDialog />
        </div>
      </div>
    </div>
  );
}
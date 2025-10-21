import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Button } from "@/components/ui/updated-button";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { StatusBadge } from "@/components/ui/status-badge";

export function InventoryStatus() {
  const { data: allProducts = [] } = useProducts();

  // Set up real-time subscription for inventory updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('inventory-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        logger.debug('Inventory data updated', {}, 'InventoryStatus');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter products that are at or below their threshold
  const lowStockItems = Array.isArray(allProducts) 
    ? allProducts.filter(product => product.stock <= product.threshold)
    : [];

  const getStockLevel = (current: number, threshold: number) => {
    const percentage = threshold > 0 ? (current / threshold) * 100 : 100;
    if (percentage <= 20) return { color: "bg-destructive", level: "Critica", badgeStatus: "error" as const, bgColor: "bg-destructive/10" };
    if (percentage <= 50) return { color: "bg-warning", level: "Bassa", badgeStatus: "warning" as const, bgColor: "bg-warning-container" };
    return { color: "bg-success", level: "Buona", badgeStatus: "success" as const, bgColor: "bg-success-container" };
  };

  return (
    <Card className="card-glow border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base sm:text-lg">Articoli con Scorte Basse</CardTitle>
        <Button variant="outlined" size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 text-xs sm:text-sm px-2 sm:px-3">
          Ordina Scorte
        </Button>
      </CardHeader>
      <CardContent>
        {lowStockItems.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {lowStockItems.map((item) => {
              const stockStatus = getStockLevel(item.stock, item.threshold);
              const percentValue = item.threshold > 0 ? (item.stock / item.threshold) * 100 : 100;
              
              return (
                <div key={item.id} className="p-2 sm:p-3 rounded-lg bg-surface-container">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{`${item.brand} ${item.model}`}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.serial_numbers && item.serial_numbers.length > 0 ? 
                          `Serial: ${item.serial_numbers[0]}` : 
                          `ID: ${item.id.slice(0, 8)}...`}
                      </p>
                    </div>
                    <StatusBadge status={stockStatus.badgeStatus} size="sm" className="flex-shrink-0 ml-2">
                      {item.stock} rimasti
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 ${stockStatus.bgColor} rounded-full h-1.5 sm:h-2 overflow-hidden`}>
                      <div
                        className={`h-full ${stockStatus.color} transition-all duration-300`}
                        style={{ width: `${Math.min(percentValue, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {item.stock}/{item.threshold}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-success-container rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Tutti gli articoli sono ben forniti!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

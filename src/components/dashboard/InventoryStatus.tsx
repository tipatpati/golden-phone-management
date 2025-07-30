import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/services/useProducts";
import { supabase } from "@/integrations/supabase/client";

export function InventoryStatus() {
  const { data: allProducts = [] } = useProducts();

  // Set up real-time subscription for inventory updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('inventory-status-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        console.log('Inventory status: Inventory data updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter products that are at or below their threshold
  const lowStockItems = allProducts.filter(product => 
    product.stock <= product.threshold
  );

  const getStockLevel = (current: number, threshold: number) => {
    const percentage = threshold > 0 ? (current / threshold) * 100 : 100;
    if (percentage <= 20) return { color: "bg-red-500", level: "Critica", bgColor: "bg-red-100" };
    if (percentage <= 50) return { color: "bg-yellow-500", level: "Bassa", bgColor: "bg-yellow-100" };
    return { color: "bg-green-500", level: "Buona", bgColor: "bg-green-100" };
  };

  const getStockBadgeVariant = (level: string) => {
    if (level === "Critica") return "destructive";
    return "outline";
  };

  return (
    <Card className="card-glow border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base sm:text-lg">Articoli con Scorte Basse</CardTitle>
        <Button variant="outline" size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 text-xs sm:text-sm px-2 sm:px-3">
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
                <div key={item.id} className="p-2 sm:p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{`${item.brand} ${item.model}`}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.serial_numbers && item.serial_numbers.length > 0 ? 
                          `Serial: ${item.serial_numbers[0]}` : 
                          `ID: ${item.id.slice(0, 8)}...`}
                      </p>
                    </div>
                    <Badge variant={getStockBadgeVariant(stockStatus.level)} className="text-xs flex-shrink-0 ml-2">
                      {item.stock} rimasti
                    </Badge>
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
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

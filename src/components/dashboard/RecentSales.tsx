import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useSales } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function RecentSales() {
  const { data: allSales = [], isLoading } = useSales();
  
  // Type cast the data array
  const salesArray = (allSales as any[]) || [];

  // Set up real-time subscription for sales updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('recent-sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        console.log('Recent sales: Sales data updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Get the 5 most recent sales
  const recentSales = salesArray.slice(0, 5);

  const getClientName = (client: any) => {
    if (!client) return "Cliente Occasionale";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getClientEmail = (client: any) => {
    return client?.email || "Nessuna email fornita";
  };

  const getClientInitials = (clientName: string) => {
    return clientName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
    <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Vendite Recenti</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Caricamento vendite recenti...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg bg-gray-50 animate-pulse">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-8 sm:w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Vendite Recenti</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {salesArray.length > 0 ? `Hai ${salesArray.length} vendite totali` : "Nessuna vendita ancora"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSales.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {recentSales.map((sale) => {
              const clientName = getClientName(sale.client);
              const clientEmail = getClientEmail(sale.client);
              const initials = getClientInitials(clientName);
              
              return (
                <div key={sale.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-xs sm:text-sm">
                        {initials}
                      </div>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium leading-none truncate">{clientName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-2">
                    <p className="font-medium text-sm sm:text-lg">€{sale.total_amount.toFixed(2)}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(sale.sale_date), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Nessuna vendita ancora. Crea la tua prima vendita!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

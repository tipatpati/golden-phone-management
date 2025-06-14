
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useSales } from "@/services/useSales";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function RecentSales() {
  const { data: allSales = [], isLoading } = useSales();

  // Set up real-time subscription for sales updates
  useEffect(() => {
    const channel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        console.log('Sales data updated');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Get the 5 most recent sales
  const recentSales = allSales.slice(0, 5);

  const getClientName = (client: any) => {
    if (!client) return "Walk-in Customer";
    return client.type === "business" 
      ? client.company_name 
      : `${client.first_name} ${client.last_name}`;
  };

  const getClientEmail = (client: any) => {
    return client?.email || "No email provided";
  };

  const getClientInitials = (clientName: string) => {
    return clientName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Recent Sales</CardTitle>
          <CardDescription>Loading recent sales...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Recent Sales</CardTitle>
        <CardDescription>
          {allSales.length > 0 ? `You have ${allSales.length} sales total` : "No sales yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSales.length > 0 ? (
          <div className="space-y-4">
            {recentSales.map((sale) => {
              const clientName = getClientName(sale.client);
              const clientEmail = getClientEmail(sale.client);
              const initials = getClientInitials(clientName);
              
              return (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-sm">
                        {initials}
                      </div>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{clientName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-medium text-lg">${sale.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.sale_date), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-muted-foreground">No sales yet. Create your first sale!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

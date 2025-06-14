
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useSales } from "@/services/useSales";
import { format } from "date-fns";

export function RecentSales() {
  const { data: allSales = [], isLoading } = useSales();
  
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

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Loading recent sales...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          {allSales.length > 0 ? `You have ${allSales.length} sales total` : "No sales yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSales.length > 0 ? (
          <div className="space-y-6">
            {recentSales.map((sale) => {
              const clientName = getClientName(sale.client);
              const clientEmail = getClientEmail(sale.client);
              
              return (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {clientName.charAt(0)}
                      </div>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{clientName}</p>
                      <p className="text-xs text-muted-foreground">{clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-medium">${sale.total_amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.sale_date), "MMM dd, HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No sales yet. Create your first sale!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

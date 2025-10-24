import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Avatar } from "@/components/ui/avatar";
import { useSales } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { logger } from "@/utils/logger";

export const RecentSales = React.memo(function RecentSales() {
  const { data: allGarentille = [], isLoading } = useSales();
  
  // Type cast the data array
  const garentilleArray = (allGarentille as any[]) || [];

  // Set up real-time subscription for garentille updates with unique channel name
  useEffect(() => {
    const channel = supabase
      .channel('recent-garentille-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        logger.debug('Garentille data updated', {}, 'RecentSales');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Get the 5 most recent garentille
  const recentGarentille = garentilleArray.slice(0, 5);

  const getClientName = (sale: any) => {
    const client = sale.client;
    if (!client) return "Cliente Occasionale";
    
    if (client.type === "business") {
      return client.company_name || 'Unnamed Business';
    }
    
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return 'Individual Client';
  };

  const getClientEmail = (client: any) => {
    return client?.email || "Nessuna email fornita";
  };

  const getClientInitials = (client: any) => {
    if (client.type === 'business') {
      const companyName = client.company_name || 'UB';
      return companyName.split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    
    let initials = '';
    if (firstName) initials += firstName.charAt(0);
    if (lastName) initials += lastName.charAt(0);
    
    return initials.toUpperCase() || 'UC';
  };

  if (isLoading) {
    return (
    <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Garentille Recenti</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Caricamento garentille recenti...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg bg-surface-container animate-pulse">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-surface-container-high rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-3 sm:h-4 bg-surface-container-high rounded w-1/3 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-surface-container-high rounded w-1/2"></div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="h-3 sm:h-4 bg-surface-container-high rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-surface-container-high rounded w-8 sm:w-12"></div>
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
        <CardTitle className="text-base sm:text-lg">Garentille Recenti</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {garentilleArray.length > 0 ? `Hai ${garentilleArray.length} garentille totali` : "Nessuna garentille ancora"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentGarentille.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {recentGarentille.map((sale) => {
              const clientName = getClientName(sale);
              const clientEmail = getClientEmail(sale.client);
              const initials = getClientInitials(sale.client);
              
              return (
                <div key={sale.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-all">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-variant text-primary-foreground font-medium text-xs sm:text-sm">
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
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-info-container rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Nessuna garentille ancora. Crea la tua prima garentille!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

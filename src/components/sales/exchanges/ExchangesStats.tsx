import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftRight, Package, Euro, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import type { ExchangeTransaction } from "@/services/sales/exchanges/types";

interface ExchangesStatsProps {
  exchanges: ExchangeTransaction[];
}

export function ExchangesStats({ exchanges }: ExchangesStatsProps) {
  const stats = React.useMemo(() => {
    const totalExchanges = exchanges.length;
    const completedExchanges = exchanges.filter(e => e.status === 'completed');
    
    const totalTradeInValue = completedExchanges.reduce((sum, e) => sum + e.trade_in_total, 0);
    const totalPurchaseValue = completedExchanges.reduce((sum, e) => sum + e.purchase_total, 0);
    const totalNetDifference = completedExchanges.reduce((sum, e) => sum + e.net_difference, 0);
    
    const totalTradeInItems = completedExchanges.reduce(
      (sum, e) => sum + (e.trade_in_items?.length || 0),
      0
    );
    
    const averageExchangeValue = completedExchanges.length > 0 
      ? totalPurchaseValue / completedExchanges.length 
      : 0;
    
    const averageTradeInValue = completedExchanges.length > 0
      ? totalTradeInValue / completedExchanges.length
      : 0;
    
    return {
      totalExchanges,
      completedExchanges: completedExchanges.length,
      totalTradeInValue,
      totalPurchaseValue,
      totalNetDifference,
      totalTradeInItems,
      averageExchangeValue,
      averageTradeInValue
    };
  }, [exchanges]);

  const statCards = [
    {
      title: "Cambi Totali",
      value: stats.totalExchanges,
      icon: ArrowLeftRight,
      description: `${stats.completedExchanges} completati`,
      color: "text-blue-600"
    },
    {
      title: "Articoli in Permuta",
      value: stats.totalTradeInItems,
      icon: Package,
      description: "Unità totali",
      color: "text-orange-600"
    },
    {
      title: "Valore Permuta Totale",
      value: `€${stats.totalTradeInValue.toFixed(2)}`,
      icon: TrendingDown,
      description: `Media: €${stats.averageTradeInValue.toFixed(2)}`,
      color: "text-green-600"
    },
    {
      title: "Valore Acquisto Totale",
      value: `€${stats.totalPurchaseValue.toFixed(2)}`,
      icon: TrendingUp,
      description: `Media: €${stats.averageExchangeValue.toFixed(2)}`,
      color: "text-primary"
    },
    {
      title: "Differenza Netta",
      value: `${stats.totalNetDifference >= 0 ? '+' : ''}€${stats.totalNetDifference.toFixed(2)}`,
      icon: BarChart3,
      description: stats.totalNetDifference >= 0 ? "Incassato" : "Pagato",
      color: stats.totalNetDifference >= 0 ? "text-green-600" : "text-orange-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

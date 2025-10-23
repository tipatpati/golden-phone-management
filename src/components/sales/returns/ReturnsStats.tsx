import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Package, Euro, AlertCircle, BarChart3, Calendar } from "lucide-react";
import type { SaleReturn } from "@/services/sales/returns/types";

interface ReturnsStatsProps {
  returns: SaleReturn[];
}

export function ReturnsStats({ returns }: ReturnsStatsProps) {
  const stats = React.useMemo(() => {
    const totalReturns = returns.length;
    const completedReturns = returns.filter(r => r.status === 'completed');
    
    const totalRefunded = completedReturns.reduce((sum, r) => sum + r.refund_amount, 0);
    const totalRestockingFees = completedReturns.reduce((sum, r) => sum + r.restocking_fee, 0);
    const totalItemsReturned = completedReturns.reduce(
      (sum, r) => sum + (r.return_items?.reduce((s, i) => s + i.quantity, 0) || 0),
      0
    );
    
    const averageRefund = totalReturns > 0 ? totalRefunded / completedReturns.length : 0;
    const averageRestockingFee = totalReturns > 0 ? totalRestockingFees / completedReturns.length : 0;
    
    // Calculate return rate (percentage of returns that are completed)
    const completionRate = totalReturns > 0 ? (completedReturns.length / totalReturns) * 100 : 0;
    
    return {
      totalReturns,
      completedReturns: completedReturns.length,
      totalRefunded,
      totalRestockingFees,
      totalItemsReturned,
      averageRefund,
      averageRestockingFee,
      completionRate
    };
  }, [returns]);

  const statCards = [
    {
      title: "Resi Totali",
      value: stats.totalReturns,
      icon: TrendingDown,
      description: `${stats.completedReturns} completati`,
      color: "text-blue-600"
    },
    {
      title: "Articoli Resi",
      value: stats.totalItemsReturned,
      icon: Package,
      description: "Unità totali",
      color: "text-orange-600"
    },
    {
      title: "Totale Rimborsato",
      value: `€${stats.totalRefunded.toFixed(2)}`,
      icon: Euro,
      description: `Media: €${stats.averageRefund.toFixed(2)}`,
      color: "text-green-600"
    },
    {
      title: "Costi Riassortimento",
      value: `€${stats.totalRestockingFees.toFixed(2)}`,
      icon: AlertCircle,
      description: `Media: €${stats.averageRestockingFee.toFixed(2)}`,
      color: "text-red-600"
    },
    {
      title: "Tasso Completamento",
      value: `${stats.completionRate.toFixed(1)}%`,
      icon: BarChart3,
      description: `${stats.completedReturns} di ${stats.totalReturns}`,
      color: "text-purple-600"
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

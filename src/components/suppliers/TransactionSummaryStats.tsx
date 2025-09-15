import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Euro,
  Package, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { useTransactionSummary } from "@/services/suppliers/SupplierTransactionService";
import type { TransactionSearchFilters } from "@/services/suppliers/types";

interface TransactionSummaryStatsProps {
  filters?: TransactionSearchFilters;
}

export function TransactionSummaryStats({ filters = {} }: TransactionSummaryStatsProps) {
  const { data: summary, isLoading, error } = useTransactionSummary(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load summary</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: "Total Transactions",
      value: summary.total_transactions.toLocaleString(),
      icon: Package,
      color: "default" as const,
      description: `${summary.pending_count} pending, ${summary.completed_count} completed`,
    },
    {
      title: "Total Amount",
      value: `€${summary.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Euro,
      color: "default" as const,
      description: "All transaction types",
    },
    {
      title: "Purchases",
      value: `€${summary.purchase_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "default" as const,
      description: "Purchase transactions",
    },
    {
      title: "Payments & Returns",
      value: `€${(summary.payment_amount + summary.return_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "secondary" as const,
      description: `€${summary.payment_amount.toFixed(2)} payments, €${summary.return_amount.toFixed(2)} returns`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
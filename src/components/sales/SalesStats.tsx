import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import type { Sale } from "@/services/sales";

interface SalesStatsProps {
  sales: Sale[];
}

export function SalesStats({ sales }: SalesStatsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
  const numberFmt = new Intl.NumberFormat();

  return (
    <section aria-label="Sales statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{currency.format(totalRevenue)}</div>
          <p className="text-sm text-muted-foreground">All completed sales</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{numberFmt.format(totalSales)}</div>
          <p className="text-sm text-muted-foreground">Number of transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Sale Value</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight">{currency.format(avgSaleValue)}</div>
          <p className="text-sm text-muted-foreground">Per transaction</p>
        </CardContent>
      </Card>
    </section>
  );
}

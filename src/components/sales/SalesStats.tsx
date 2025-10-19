import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Euro, TrendingUp, ShoppingCart } from "lucide-react";
import type { Sale } from "@/services/sales";

interface SalesStatsProps {
  sales: Sale[];
}

export function SalesStats({ sales }: SalesStatsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" });
  const numberFmt = new Intl.NumberFormat();

  return (
    <section aria-label="Sales statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card variant="elevated" className="glass-card border-glow md-motion-smooth hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-on-surface">Total Revenue</CardTitle>
          <div className="rounded-full bg-primary/10 p-2.5 ring-1 ring-primary/20">
            <Euro className="h-5 w-5 text-primary" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight gradient-tech-text">{currency.format(totalRevenue)}</div>
          <p className="text-sm text-on-surface-variant mt-1">All completed sales</p>
        </CardContent>
      </Card>

      <Card variant="elevated" className="glass-card border-glow md-motion-smooth hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-on-surface">Total Sales</CardTitle>
          <div className="rounded-full bg-secondary/10 p-2.5 ring-1 ring-secondary/20">
            <ShoppingCart className="h-5 w-5 text-secondary" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight gradient-tech-text">{numberFmt.format(totalSales)}</div>
          <p className="text-sm text-on-surface-variant mt-1">Number of transactions</p>
        </CardContent>
      </Card>

      <Card variant="elevated" className="glass-card border-glow md-motion-smooth hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-on-surface">Avg. Sale Value</CardTitle>
          <div className="rounded-full bg-tertiary/10 p-2.5 ring-1 ring-tertiary/20">
            <TrendingUp className="h-5 w-5 text-tertiary" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight gradient-tech-text">{currency.format(avgSaleValue)}</div>
          <p className="text-sm text-on-surface-variant mt-1">Per transaction</p>
        </CardContent>
      </Card>
    </section>
  );
}

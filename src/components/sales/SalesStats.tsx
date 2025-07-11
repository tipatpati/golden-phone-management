import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import type { Sale } from "@/services/sales";

interface SalesStatsProps {
  sales: Sale[];
}

export function SalesStats({ sales }: SalesStatsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Total Revenue</CardTitle>
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-blue-900">${totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-blue-600 font-medium">from {totalSales} total sales</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-green-700 uppercase tracking-wider">Total Sales</CardTitle>
          <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-3 shadow-lg">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-green-900">{totalSales}</div>
          <p className="text-sm text-green-600 font-medium">completed transactions</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Average Sale</CardTitle>
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-purple-900">${avgSaleValue.toFixed(2)}</div>
          <p className="text-sm text-purple-600 font-medium">per transaction</p>
        </CardContent>
      </Card>
    </div>
  );
}
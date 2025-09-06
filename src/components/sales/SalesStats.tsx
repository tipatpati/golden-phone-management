import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";
import type { Sale } from "@/services/sales";
interface SalesStatsProps {
  sales: Sale[];
}
export function SalesStats({
  sales
}: SalesStatsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  return;
}
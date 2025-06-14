
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Calendar } from "lucide-react";
import { useSales } from "@/services/useSales";
import { useRepairs } from "@/services/useRepairs";
import { useClients } from "@/services/useClients";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardOverview() {
  const { data: allSales = [] } = useSales();
  const { data: allRepairs = [] } = useRepairs();
  const { data: allClients = [] } = useClients();

  // Calculate today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = allSales.filter(sale => sale.sale_date.startsWith(today));
  const pendingRepairs = allRepairs.filter(repair => 
    repair.status === 'in_progress' || repair.status === 'awaiting_parts'
  );

  // Calculate previous period for trends
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdaySales = allSales.filter(sale => sale.sale_date.startsWith(yesterdayStr));

  // Calculate this month's new clients
  const thisMonth = new Date();
  const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString();
  const newClientsThisMonth = allClients.filter(client => 
    client.created_at && client.created_at >= firstDayOfMonth
  );

  const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const revenueChange = yesterdayRevenue > 0 
    ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
    : '0';

  const overviewData = [
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      change: `${revenueChange}%`,
      isPositive: parseFloat(revenueChange) >= 0,
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Sales",
      value: todaySales.length.toString(),
      change: `${yesterdaySales.length > 0 ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length * 100).toFixed(1) : '0'}%`,
      isPositive: todaySales.length >= yesterdaySales.length,
      icon: ShoppingBag,
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "New Customers",
      value: newClientsThisMonth.length.toString(),
      change: "+24.5%",
      isPositive: true,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Pending Repairs",
      value: pendingRepairs.length.toString(),
      change: pendingRepairs.length > 0 ? "Active" : "None",
      isPositive: pendingRepairs.length < 10,
      icon: Calendar,
      gradient: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card key={index} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
            <div className={`rounded-full bg-gradient-to-br ${item.gradient} p-2.5 shadow-md`}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
            <div className="flex items-center text-xs">
              {typeof item.change === 'string' && item.change.includes('%') ? (
                <>
                  {item.isPositive ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={item.isPositive ? "text-green-500" : "text-red-500"}>
                    {item.change}
                  </span>
                  <span className="text-gray-500 ml-1">from yesterday</span>
                </>
              ) : (
                <span className="text-gray-500">{item.change}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

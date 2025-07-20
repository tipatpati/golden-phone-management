import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Wrench } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { useSales } from "@/services/useSales";
import { useRepairs } from "@/services/useRepairs";
import { useProducts } from "@/services/useProducts";
import { useClients } from "@/services/useClients";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSkeleton } from "@/components/ui/loading-spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(221, 83%, 53%)"
  },
  sales: {
    label: "Sales",
    color: "hsl(142, 76%, 36%)"
  }
};
export const SalesOverview = React.memo(() => {
  const {
    data: allSales = [],
    isLoading: salesLoading,
    error: salesError
  } = useSales();
  const {
    data: allRepairs = [],
    isLoading: repairsLoading
  } = useRepairs();
  const {
    data: allProducts = [],
    isLoading: productsLoading
  } = useProducts();
  const {
    data: allClients = [],
    isLoading: clientsLoading
  } = useClients();
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const isLoading = salesLoading || repairsLoading || productsLoading || clientsLoading;
  if (salesError) {
    throw salesError;
  }

  // Set up real-time subscriptions with unique channel names
  useEffect(() => {
    const salesChannel = supabase.channel('sales-overview-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sales'
    }, () => {
      console.log('Sales overview: Sales data updated');
    }).subscribe();
    const repairsChannel = supabase.channel('repairs-overview-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'repairs'
    }, () => {
      console.log('Sales overview: Repairs data updated');
    }).subscribe();
    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(repairsChannel);
    };
  }, []);

  // Calculate current period data
  const today = new Date();
  const getDateRange = (period: string) => {
    const dates = [];
    const daysBack = period === 'daily' ? 7 : period === 'weekly' ? 4 : 12;
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(today);
      if (period === 'daily') {
        date.setDate(date.getDate() - i);
      } else if (period === 'weekly') {
        date.setDate(date.getDate() - i * 7);
      } else {
        date.setMonth(date.getMonth() - i);
      }
      dates.push(date);
    }
    return dates;
  };
  const chartData = getDateRange(timePeriod).map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const periodSales = allSales.filter(sale => {
      if (timePeriod === 'daily') {
        return sale.sale_date.startsWith(dateStr);
      } else if (timePeriod === 'weekly') {
        const saleDate = new Date(sale.sale_date);
        const weekStart = new Date(date);
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return saleDate >= weekStart && saleDate <= weekEnd;
      } else {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear();
      }
    });
    const revenue = periodSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    return {
      period: timePeriod === 'daily' ? date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }) : timePeriod === 'weekly' ? `Week ${Math.ceil(date.getDate() / 7)}` : date.toLocaleDateString('en-US', {
        month: 'short'
      }),
      revenue: revenue,
      sales: periodSales.length
    };
  });

  // Calculate today's data
  const todayStr = today.toISOString().split('T')[0];
  const todaySales = allSales.filter(sale => sale.sale_date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Calculate this week's data
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const thisWeekSales = allSales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= weekStart;
  });
  const thisWeekRevenue = thisWeekSales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Calculate this month's data
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthSales = allSales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= monthStart;
  });
  const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + sale.total_amount, 0);

  // Quick stats with real data
  const activeRepairs = allRepairs.filter(repair => repair.status === 'in_progress' || repair.status === 'awaiting_parts').length;
  const lowStockItems = allProducts.filter(product => product.stock <= product.threshold).length;
  const newClientsThisMonth = allClients.filter(client => {
    if (!client.created_at) return false;
    const clientDate = new Date(client.created_at);
    return clientDate >= monthStart;
  }).length;
  const quickStats = [{
    title: "Active Repairs",
    value: activeRepairs.toString(),
    icon: Wrench,
    color: "text-orange-600"
  }, {
    title: "Low Stock Items",
    value: lowStockItems.toString(),
    icon: Package,
    color: "text-red-600"
  }, {
    title: "New Clients",
    value: newClientsThisMonth.toString(),
    icon: Users,
    color: "text-green-600"
  }];

  // Top products calculation
  const productSales = allSales.flatMap(sale => sale.sale_items || []);
  const productRevenue = productSales.reduce((acc, item) => {
    const productName = item.product?.name || 'Unknown Product';
    acc[productName] = (acc[productName] || 0) + item.total_price;
    return acc;
  }, {} as Record<string, number>);
  const topProducts = Object.entries(productRevenue).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, revenue]) => ({
    name,
    revenue,
    sold: productSales.filter(item => item.product?.name === name).reduce((sum, item) => sum + item.quantity, 0)
  }));
  return <ErrorBoundary>
      {isLoading ? <div className="space-y-6">
          <div className="flex gap-2">
            {Array.from({
          length: 3
        }).map((_, i) => <div key={i} className="h-10 w-20 bg-gray-200 rounded animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({
          length: 3
        }).map((_, i) => <Card key={i} className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>)}
          </div>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div> : <div className="space-y-4 sm:space-y-6">
      {/* Time Period Selector */}
      <div className="flex flex-wrap gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map(period => <button key={period} onClick={() => setTimePeriod(period)} className={`px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${timePeriod === period ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>)}
      </div>

      {/* Sales Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">${todayRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-blue-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              <span>{todaySales.length} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-900">${thisWeekRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              <span>{thisWeekSales.length} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-900">${thisMonthRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-purple-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              <span>{thisMonthSales.length} transactions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
          <CardDescription>
            {timePeriod === 'daily' ? 'Last 7 days' : timePeriod === 'weekly' ? 'Last 4 weeks' : 'Last 12 months'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pr-6">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="period" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="revenue" stroke="url(#revenueGradient)" strokeWidth={3} dot={{
                fill: '#3b82f6',
                strokeWidth: 2,
                r: 4
              }} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Quick Stats and Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {quickStats.map((stat, index) => <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-full bg-white shadow-sm">
                    <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{stat.title}</span>
                </div>
                <Badge variant="outline" className="bg-white text-xs">{stat.value}</Badge>
              </div>)}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Top Products This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {topProducts.length > 0 ? topProducts.map((product, index) => <div key={index} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base truncate">{product.name}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{product.sold} units sold</div>
                </div>
                <div className="text-right ml-2">
                  <div className="font-medium text-sm sm:text-base">${product.revenue.toFixed(2)}</div>
                </div>
              </div>) : <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <div className="text-xs sm:text-sm">No sales data available yet</div>
              </div>}
          </CardContent>
        </Card>
      </div>
        </div>}
    </ErrorBoundary>;
});
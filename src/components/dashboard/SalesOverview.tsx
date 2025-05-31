
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Wrench } from "lucide-react";

export function SalesOverview() {
  // Mock data - would come from API in real implementation
  const salesData = {
    today: {
      revenue: 2340.50,
      transactions: 15,
      trend: "+12%"
    },
    thisWeek: {
      revenue: 18750.25,
      transactions: 89,
      trend: "+8%"
    },
    thisMonth: {
      revenue: 67890.75,
      transactions: 342,
      trend: "+15%"
    }
  };

  const topProducts = [
    { name: "iPhone 13 Pro", sold: 12, revenue: 11988 },
    { name: "Samsung Galaxy S22", sold: 8, revenue: 7199.92 },
    { name: "AirPods Pro", sold: 25, revenue: 4997.5 },
  ];

  const quickStats = [
    {
      title: "Active Repairs",
      value: "23",
      icon: Wrench,
      color: "text-orange-600"
    },
    {
      title: "Low Stock Items",
      value: "7",
      icon: Package,
      color: "text-red-600"
    },
    {
      title: "New Clients",
      value: "18",
      icon: Users,
      color: "text-green-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sales Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.today.revenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">{salesData.today.trend}</span>
              <span className="ml-2">{salesData.today.transactions} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.thisWeek.revenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">{salesData.thisWeek.trend}</span>
              <span className="ml-2">{salesData.thisWeek.transactions} transactions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.thisMonth.revenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">{salesData.thisMonth.trend}</span>
              <span className="ml-2">{salesData.thisMonth.transactions} transactions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm font-medium">{stat.title}</span>
                </div>
                <Badge variant="outline">{stat.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.sold} units sold</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${product.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

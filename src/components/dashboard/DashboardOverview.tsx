
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, Users, Calendar } from "lucide-react";

export function DashboardOverview() {
  // Sample data - would come from API in real implementation
  const overviewData = [
    {
      title: "Total Revenue",
      value: "$12,345.67",
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Total Sales",
      value: "156",
      change: "+8.2%",
      isPositive: true,
      icon: ShoppingBag,
    },
    {
      title: "New Customers",
      value: "32",
      change: "+24.5%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "Pending Repairs",
      value: "18",
      change: "-5.4%",
      isPositive: false,
      icon: Calendar,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewData.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className="rounded-full bg-muted p-2">
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="flex items-center text-xs">
              {item.isPositive ? (
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={item.isPositive ? "text-green-500" : "text-red-500"}>
                {item.change} from last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

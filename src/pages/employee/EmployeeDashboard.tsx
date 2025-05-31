
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";

interface EmployeeDashboardProps {
  userRole: UserRole;
}

export function EmployeeDashboard({ userRole }: EmployeeDashboardProps) {
  const config = ROLE_CONFIGS[userRole];

  const getQuickStats = () => {
    switch (userRole) {
      case 'salesperson':
        return [
          { title: "Today's Sales", value: "8", icon: ShoppingCart, color: "text-green-600" },
          { title: "Revenue", value: "$2,450", icon: TrendingUp, color: "text-blue-600" },
          { title: "New Clients", value: "3", icon: Users, color: "text-purple-600" },
        ];
      case 'inventory_manager':
        return [
          { title: "Low Stock Items", value: "12", icon: Package, color: "text-red-600" },
          { title: "Products Added", value: "5", icon: Package, color: "text-green-600" },
          { title: "Stock Value", value: "$85,300", icon: TrendingUp, color: "text-blue-600" },
        ];
      case 'manager':
        return [
          { title: "Team Sales", value: "24", icon: ShoppingCart, color: "text-green-600" },
          { title: "Active Repairs", value: "7", icon: Package, color: "text-orange-600" },
          { title: "Daily Revenue", value: "$5,680", icon: TrendingUp, color: "text-blue-600" },
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case 'salesperson':
        return [
          { title: "New Sale", description: "Create a new sale transaction", href: "/sales" },
          { title: "Find Client", description: "Search and manage clients", href: "/clients" },
        ];
      case 'inventory_manager':
        return [
          { title: "Add Product", description: "Add new products to inventory", href: "/inventory" },
          { title: "Stock Check", description: "Review low stock items", href: "/inventory" },
        ];
      case 'manager':
        return [
          { title: "Sales Overview", description: "Monitor team performance", href: "/sales" },
          { title: "Repair Queue", description: "Manage repair requests", href: "/repairs" },
        ];
      default:
        return [];
    }
  };

  const stats = getQuickStats();
  const actions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back!</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{config.name}</Badge>
            <span className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href={action.href}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Go to {action.title} →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific content */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Role Access</CardTitle>
            <CardDescription>Features available to you as {config.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {config.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">
                    {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

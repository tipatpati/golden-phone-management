
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { ShoppingCart, Users, Package, TrendingUp, ArrowRight } from "lucide-react";

interface EmployeeDashboardProps {
  userRole: UserRole;
}

export function EmployeeDashboard({ userRole }: EmployeeDashboardProps) {
  const config = ROLE_CONFIGS[userRole];

  const getQuickStats = () => {
    switch (userRole) {
      case 'salesperson':
        return [
          { title: "Today's Sales", value: "8", icon: ShoppingCart, color: "text-green-600", gradient: "from-green-500 to-green-600" },
          { title: "Revenue", value: "$2,450", icon: TrendingUp, color: "text-blue-600", gradient: "from-blue-500 to-blue-600" },
          { title: "New Clients", value: "3", icon: Users, color: "text-purple-600", gradient: "from-purple-500 to-purple-600" },
        ];
      case 'inventory_manager':
        return [
          { title: "Low Stock Items", value: "12", icon: Package, color: "text-red-600", gradient: "from-red-500 to-red-600" },
          { title: "Products Added", value: "5", icon: Package, color: "text-green-600", gradient: "from-green-500 to-green-600" },
          { title: "Stock Value", value: "$85,300", icon: TrendingUp, color: "text-blue-600", gradient: "from-blue-500 to-blue-600" },
        ];
      case 'manager':
        return [
          { title: "Team Sales", value: "24", icon: ShoppingCart, color: "text-green-600", gradient: "from-green-500 to-green-600" },
          { title: "Active Repairs", value: "7", icon: Package, color: "text-orange-600", gradient: "from-orange-500 to-orange-600" },
          { title: "Daily Revenue", value: "$5,680", icon: TrendingUp, color: "text-blue-600", gradient: "from-blue-500 to-blue-600" },
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
    <div className="space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">{config.name}</Badge>
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
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`rounded-full bg-gradient-to-br ${stat.gradient} p-2.5 shadow-md`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action, index) => (
          <Card key={index} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a 
                href={action.href}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300"
              >
                Go to {action.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role-specific content */}
      <div className="grid gap-6">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Your Role Access</CardTitle>
            <CardDescription>Features available to you as {config.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {config.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
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

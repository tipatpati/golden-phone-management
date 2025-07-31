import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Wrench, Building2, ArrowRight, PackageSearch, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SalesNavCards() {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const salesActions = [
    {
      title: "View Inventory",
      description: "Browse available products",
      icon: PackageSearch,
      href: "/inventory",
      roles: ['salesperson', 'technician', 'inventory_manager', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Find Client",
      description: "Search for existing clients",
      icon: Users,
      href: "/clients",
      roles: ['salesperson', 'technician', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Create Repair",
      description: "Start a new repair order",
      icon: Wrench,
      href: "/repairs",
      roles: ['technician', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Suppliers",
      description: "Manage supplier relationships",
      icon: Building2,
      href: "/suppliers",
      roles: ['inventory_manager', 'manager', 'admin', 'super_admin']
    }
  ];

  const filteredActions = salesActions.filter(action => 
    userRole && action.roles.includes(userRole)
  );

  if (filteredActions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border-0">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Navigation</h3>
        <p className="text-sm text-muted-foreground">Access related modules for sales operations</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {filteredActions.map((action, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white hover:scale-105"
            onClick={() => navigate(action.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 shadow-md">
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {action.title}
                </CardTitle>
              </div>
              <CardDescription className="text-xs group-hover:text-gray-700 transition-colors duration-300 ml-11">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="inline-flex items-center text-blue-600 hover:text-blue-700 text-xs font-medium group-hover:translate-x-1 transition-transform duration-300 ml-11">
                Go to {action.title}
                <ArrowRight className="ml-2 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
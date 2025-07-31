
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, Wrench, Building2, ArrowRight, PackageSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ConnectionStatusProps {
  canAddProducts: boolean;
  isCheckingConnection: boolean;
  onTestConnection: () => void;
}

export function ConnectionStatus({ 
  canAddProducts, 
  isCheckingConnection, 
  onTestConnection 
}: ConnectionStatusProps) {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const inventoryActions = [
    {
      title: "View Products",
      description: "Browse all inventory items",
      icon: PackageSearch,
      href: "/inventory",
      roles: ['salesperson', 'technician', 'inventory_manager', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Create Sale",
      description: "Start a new product sale",
      icon: ShoppingCart,
      href: "/sales",
      roles: ['salesperson', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Find Client",
      description: "Search for existing clients",
      icon: Users,
      href: "/clients",
      roles: ['salesperson', 'technician', 'manager', 'admin', 'super_admin']
    },
    {
      title: "New Repair",
      description: "Create repair order",
      icon: Wrench,
      href: "/repairs",
      roles: ['technician', 'manager', 'admin', 'super_admin']
    },
    {
      title: "Suppliers",
      description: "Manage suppliers",
      icon: Building2,
      href: "/suppliers",
      roles: ['inventory_manager', 'manager', 'admin', 'super_admin']
    }
  ];

  const filteredActions = inventoryActions.filter(action => 
    userRole && action.roles.includes(userRole)
  );

  return (
    <div className="w-full">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

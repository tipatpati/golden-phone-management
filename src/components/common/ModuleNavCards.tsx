import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Package, ShoppingCart, Users, Wrench, Building2, ArrowRight, PackageSearch } from "lucide-react";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { UserRole } from "@/types/roles";

interface ModuleNavCardsProps {
  currentModule?: string;
}

export function ModuleNavCards({ currentModule }: ModuleNavCardsProps) {
  const navigate = useNavigate();
  const { data: currentRole } = useCurrentUserRole();

  const allActions = [
    {
      title: "Visualizza Inventario",
      description: "Sfoglia tutti gli articoli in inventario",
      icon: PackageSearch,
      href: "/inventory",
      module: "inventory",
      requiredPermissions: ['inventory'] // Salespeople shouldn't access inventory
    },
    {
      title: "Crea Garentille",
      description: "Inizia una nuova garentille prodotto",
      icon: ShoppingCart,
      href: "/sales",
      module: "sales",
      requiredPermissions: ['sales'] // Updated to match role permissions
    },
    {
      title: "Trova Cliente",
      description: "Cerca clienti esistenti",
      icon: Users,
      href: "/clients",
      module: "clients",
      requiredPermissions: ['clients'] // Updated to match role permissions
    },
    {
      title: "Nuova Riparazione",
      description: "Crea ordine di riparazione",
      icon: Wrench,
      href: "/repairs",
      module: "repairs",
      requiredPermissions: ['repairs'] // Updated to match role permissions
    },
    {
      title: "Fornitori",
      description: "Gestisci fornitori",
      icon: Building2,
      href: "/suppliers",
      module: "suppliers",
      requiredPermissions: ['suppliers'] // Updated to match role permissions
    }
  ];

  // Filter actions based on role permissions and exclude current module
  const filteredActions = allActions.filter(action => {
    if (action.module === currentModule) return false;
    if (!currentRole) return false;
    
    // Check if user has any of the required permissions
    return action.requiredPermissions.some(permission => 
      roleUtils.hasPermission(currentRole, permission)
    );
  });

  if (filteredActions.length === 0) return null;

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border-0">
      <h3 className="text-2xl font-bold text-foreground mb-6">Navigazione Rapida</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredActions.map((action, index) => {
          const IconComponent = action.icon;
          
          return (
            <button
              key={index}
              onClick={() => navigate(action.href)}
              className="
                bg-primary hover:bg-primary/90
                text-primary-foreground
                rounded-2xl p-6 
                shadow-xl hover:shadow-2xl 
                transform hover:scale-105 
                transition-all duration-300 
                border-0
                min-h-[120px]
                flex flex-col items-center justify-center
                font-bold text-lg
                active:scale-95
              "
            >
              <IconComponent className="h-10 w-10 mb-3" />
              <span className="text-center leading-tight">
                {action.title.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
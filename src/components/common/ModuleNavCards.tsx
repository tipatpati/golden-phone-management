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
    <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 shadow-lg">
      <h3 className="text-2xl font-semibold text-on-surface mb-6">Navigazione Rapida</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredActions.map((action, index) => {
          const IconComponent = action.icon;
          
          // Define color scheme for each module matching dashboard
          const getModuleColors = (module: string) => {
            switch (module) {
              case 'sales':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
              case 'clients':
                return 'bg-purple-600 hover:bg-purple-700 text-white';
              case 'repairs':
                return 'bg-orange-600 hover:bg-orange-700 text-white';
              case 'suppliers':
                return 'bg-yellow-600 hover:bg-yellow-700 text-white';
              case 'inventory':
                return 'bg-green-600 hover:bg-green-700 text-white';
              default:
                return 'bg-primary hover:bg-primary/90 text-primary-foreground';
            }
          };
          
          return (
            <button
              key={index}
              onClick={() => navigate(action.href)}
              className={`
                ${getModuleColors(action.module)}
                rounded-2xl p-6 
                md-motion-smooth hover:scale-105
                min-h-[120px]
                flex flex-col items-center justify-center text-center
                font-semibold text-lg
                active:scale-95
                shadow-xl hover:shadow-2xl
                border border-white/10
              `}
            >
              <IconComponent className="h-10 w-10 mb-3 drop-shadow-lg" />
              <span className="text-center leading-tight drop-shadow-md">
                {action.title.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
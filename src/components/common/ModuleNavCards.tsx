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
      title: "Crea Garanzia",
      description: "Inizia una nuova garanzia prodotto",
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
          
          // Define neon styling for each module matching dashboard
          const getModuleStyle = (module: string) => {
            switch (module) {
              case 'sales':
                return {
                  bg: 'bg-gradient-to-br from-blue-600 to-blue-700',
                  shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_rgba(59,130,246,0.7)]',
                  border: 'border-2 border-blue-400/50'
                };
              case 'repairs':
                return {
                  bg: 'bg-gradient-to-br from-rose-600 to-rose-700',
                  shadow: 'shadow-[0_0_40px_rgba(244,63,94,0.5)] hover:shadow-[0_0_60px_rgba(244,63,94,0.7)]',
                  border: 'border-2 border-rose-400/50'
                };
              case 'inventory':
                return {
                  bg: 'bg-gradient-to-br from-green-600 to-green-700',
                  shadow: 'shadow-[0_0_40px_rgba(34,197,94,0.5)] hover:shadow-[0_0_60px_rgba(34,197,94,0.7)]',
                  border: 'border-2 border-green-400/50'
                };
              case 'clients':
                return {
                  bg: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
                  shadow: 'shadow-[0_0_40px_rgba(8,145,178,0.5)] hover:shadow-[0_0_60px_rgba(8,145,178,0.7)]',
                  border: 'border-2 border-cyan-400/50'
                };
              case 'suppliers':
                return {
                  bg: 'bg-gradient-to-br from-amber-600 to-amber-700',
                  shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_rgba(245,158,11,0.7)]',
                  border: 'border-2 border-amber-400/50'
                };
              default:
                return {
                  bg: 'bg-gradient-to-br from-primary to-primary-variant',
                  shadow: 'shadow-xl hover:shadow-2xl',
                  border: 'border-2 border-primary/50'
                };
            }
          };
          
          const style = getModuleStyle(action.module);
          
          return (
            <button
              key={index}
              onClick={() => navigate(action.href)}
              className={`
                ${style.bg}
                ${style.shadow}
                ${style.border}
                text-white
                rounded-3xl p-6 
                md-motion-smooth hover:scale-105
                min-h-[120px]
                flex flex-col items-center justify-center text-center
                font-semibold text-lg
                active:scale-95
                backdrop-blur-sm
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
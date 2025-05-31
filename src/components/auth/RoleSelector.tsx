
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROLE_CONFIGS, UserRole } from "@/types/roles";
import { Users, Package, ShoppingCart, Settings } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return Settings;
    case 'manager':
      return Users;
    case 'inventory_manager':
      return Package;
    case 'salesperson':
      return ShoppingCart;
    default:
      return Users;
  }
};

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const employeeRoles: UserRole[] = ['manager', 'inventory_manager', 'salesperson'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GOLDEN PHONE Portale Dipendenti</h1>
          <p className="text-gray-600">Seleziona il tuo ruolo per continuare</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {employeeRoles.map((role) => {
            const config = ROLE_CONFIGS[role];
            const Icon = getRoleIcon(role);
            
            return (
              <Card key={role} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{config.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 mb-6 space-y-1">
                    {config.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                        {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => onRoleSelect(role)}
                    className="w-full"
                  >
                    Continua come {config.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <Button 
            variant="link" 
            onClick={() => onRoleSelect('admin')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Proprietario del negozio? Clicca qui
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/utils/rolePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Shield, User, Key } from 'lucide-react';

/**
 * Development component for debugging role permissions
 * Only shows in development mode
 */
export function PermissionDebugger() {
  const { user, userRole, session } = useAuth();
  const rolePermissions = useRolePermissions();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!user) {
    return null;
  }

  const userPermissions = rolePermissions.getAllPermissions();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-2 border-orange-500 bg-orange-50">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-sm text-orange-800">
                    Permission Debugger
                  </CardTitle>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-orange-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-orange-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* User Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className="text-xs font-medium">User Info</span>
                </div>
                <div className="text-xs space-y-1 ml-5">
                  <div>ID: {user.id}</div>
                  <div>Email: {user.email}</div>
                  <div>Role: <Badge variant="outline">{userRole || 'None'}</Badge></div>
                  <div>Session: <Badge variant={session ? 'default' : 'destructive'}>
                    {session ? 'Active' : 'Inactive'}
                  </Badge></div>
                </div>
              </div>

              {/* Current Permissions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span className="text-xs font-medium">Current Permissions ({userPermissions.length})</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 ml-5">
                  {userPermissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs mr-1 mb-1">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permission Tests */}
              <div className="space-y-2">
                <span className="text-xs font-medium">Quick Tests</span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>Admin Panel: <Badge variant={rolePermissions.canAccessAdminFeatures() ? 'default' : 'destructive'} className="text-xs">
                    {rolePermissions.canAccessAdminFeatures() ? 'Yes' : 'No'}
                  </Badge></div>
                  <div>Sales: <Badge variant={rolePermissions.canManageSales() ? 'default' : 'destructive'} className="text-xs">
                    {rolePermissions.canManageSales() ? 'Yes' : 'No'}
                  </Badge></div>
                  <div>Inventory: <Badge variant={rolePermissions.canManageInventory() ? 'default' : 'destructive'} className="text-xs">
                    {rolePermissions.canManageInventory() ? 'Yes' : 'No'}
                  </Badge></div>
                  <div>Finance: <Badge variant={rolePermissions.canAccessFinanceFeatures() ? 'default' : 'destructive'} className="text-xs">
                    {rolePermissions.canAccessFinanceFeatures() ? 'Yes' : 'No'}
                  </Badge></div>
                </div>
              </div>

              {/* Module Access */}
              <div className="space-y-2">
                <span className="text-xs font-medium">Module Access</span>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {['sales', 'inventory', 'repairs', 'clients', 'admin', 'finance'].map(module => (
                    <div key={module}>
                      {module}: <Badge variant={rolePermissions.canAccessModule(module) ? 'default' : 'destructive'} className="text-xs">
                        {rolePermissions.canAccessModule(module) ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => console.log('Full Role Debug:', {
                  user,
                  userRole,
                  session,
                  permissions: userPermissions,
                  allRolePermissions: ROLE_PERMISSIONS,
                  allPermissions: PERMISSIONS
                })}
                className="w-full text-xs"
              >
                Log Full Debug Info
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
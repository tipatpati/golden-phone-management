import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/enhanced-card";
import { Button } from "@/components/ui/enhanced-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserRole, useUpdateUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { AdminOnly } from "@/components/common/RoleGuard";
import { Users, Shield, AlertTriangle } from "lucide-react";
import { RoleChangeConfirmationDialog } from "@/components/security/RoleChangeConfirmationDialog";
import { logSecurityEvent } from "@/utils/securityAudit";

export function RoleManagement() {
  const { user } = useAuth();
  const { data: currentRole, isLoading } = useCurrentUserRole();
  const updateRoleMutation = useUpdateUserRole();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'salesperson');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  React.useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  const handleRoleChangeRequest = async () => {
    if (selectedRole === currentRole || !user?.id) {
      return;
    }

    // Log the attempted role change for security audit
    await logSecurityEvent({
      event_type: 'role_change_attempted',
      event_data: {
        target_user_id: user.id,
        old_role: currentRole,
        new_role: selectedRole,
        is_self_change: true,
        timestamp: new Date().toISOString()
      }
    });

    setShowConfirmDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!user?.id || !selectedRole || selectedRole === currentRole) return;

    try {
      await updateRoleMutation.mutateAsync({
        targetUserId: user.id,
        newRole: selectedRole
      });
      
      // Log successful role change
      await logSecurityEvent({
        event_type: 'role_change_completed',
        event_data: {
          target_user_id: user.id,
          old_role: currentRole,
          new_role: selectedRole,
          is_self_change: true,
          timestamp: new Date().toISOString()
        }
      });
      
      setShowConfirmDialog(false);
    } catch (error) {
      // Log failed role change attempt
      await logSecurityEvent({
        event_type: 'role_change_failed',
        event_data: {
          target_user_id: user.id,
          old_role: currentRole,
          attempted_role: selectedRole,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const isDangerousChange = () => {
    if (!currentRole) return false;
    return (
      (!roleUtils.hasPermissionLevel(currentRole, 'admin') && roleUtils.hasPermissionLevel(selectedRole, 'admin')) || 
      (roleUtils.hasPermissionLevel(currentRole, 'admin') && !roleUtils.hasPermissionLevel(selectedRole, 'admin'))
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading role information...</div>;
  }

  return (
    <AdminOnly fallback={
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Only administrators can access role management.
          </p>
        </CardContent>
      </Card>
    }>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role Management
            </CardTitle>
            <CardDescription>
              Manage user roles and permissions (Admin Only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">
                    {currentRole ? roleUtils.getRoleName(currentRole) : 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Change Role</p>
              <div className="flex items-center gap-2">
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleUtils.getManageableRoles(currentRole || 'salesperson').map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleUtils.getRoleName(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleRoleChangeRequest}
                  disabled={updateRoleMutation.isPending || selectedRole === currentRole}
                  variant={roleUtils.hasPermissionLevel(selectedRole, 'admin') ? 'destructive' : 'filled'}
                >
                  {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </div>
              {selectedRole && (
                <p className="text-sm text-muted-foreground">
                  {roleUtils.getRoleDescription(selectedRole)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Current permissions for {currentRole ? roleUtils.getRoleName(currentRole) : 'your role'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentRole && (
              <div className="grid gap-2">
                {roleUtils.getRoleFeatures(currentRole).map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm">
                      {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Change Confirmation Dialog */}
        <RoleChangeConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleUpdateRole}
          currentRole={currentRole || 'salesperson'}
          newRole={selectedRole}
          targetUserId={user?.id || ''}
          isOwnRole={true}
        />
      </div>
    </AdminOnly>
  );
}

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield, AlertTriangle, History } from "lucide-react";
import { RoleChangeConfirmationDialog } from "@/components/security/RoleChangeConfirmationDialog";
import { logSecurityEvent } from "@/utils/securityAudit";

export function RoleManagement() {
  const { userRole, updateUserRole, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || 'salesperson');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleRoleChangeRequest = () => {
    if (selectedRole === userRole) {
      toast.info("Role is already set to this value");
      return;
    }

    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    // Prevent admins from changing their own role without proper verification
    if ((userRole === 'admin' || userRole === 'super_admin') && user.id && selectedRole !== userRole) {
      setShowConfirmDialog(true);
      return;
    }

    // For high-risk changes, always show confirmation
    if ((userRole !== 'admin' && userRole !== 'super_admin' && (selectedRole === 'admin' || selectedRole === 'super_admin')) || 
        ((userRole === 'admin' || userRole === 'super_admin') && selectedRole !== 'admin' && selectedRole !== 'super_admin')) {
      setShowConfirmDialog(true);
      return;
    }

    // For lower-risk changes, proceed directly
    handleUpdateRole();
  };

  const handleUpdateRole = async () => {
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      // Log the attempted role change for security audit
      await logSecurityEvent({
        event_type: 'role_change_attempted',
        event_data: {
          target_user_id: user.id,
          old_role: userRole,
          new_role: selectedRole,
          is_self_change: true,
          timestamp: new Date().toISOString()
        }
      });

      await updateUserRole(user.id, selectedRole);
      setShowConfirmDialog(false);
      
      // Log successful role change
      await logSecurityEvent({
        event_type: 'role_change_completed',
        event_data: {
          target_user_id: user.id,
          old_role: userRole,
          new_role: selectedRole,
          is_self_change: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // Log failed role change attempt
      await logSecurityEvent({
        event_type: 'role_change_failed',
        event_data: {
          target_user_id: user.id,
          old_role: userRole,
          attempted_role: selectedRole,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return (
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
    );
  }

  return (
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
                  {userRole ? ROLE_CONFIGS[userRole].name : 'Unknown'}
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
                  {(Object.keys(ROLE_CONFIGS) as UserRole[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_CONFIGS[role].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleRoleChangeRequest}
                disabled={isUpdating || selectedRole === userRole}
                variant={(selectedRole === 'admin' || selectedRole === 'super_admin') ? 'destructive' : 'default'}
              >
                {isUpdating ? "Updating..." : "Update Role"}
              </Button>
            </div>
            {selectedRole && (
              <p className="text-sm text-muted-foreground">
                {ROLE_CONFIGS[selectedRole].description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Current permissions for {userRole ? ROLE_CONFIGS[userRole].name : 'your role'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRole && (
            <div className="grid gap-2">
              {ROLE_CONFIGS[userRole].features.map((feature) => (
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
        currentRole={userRole || 'salesperson'}
        newRole={selectedRole}
        targetUserId={user?.id || ''}
        isOwnRole={true}
      />
    </div>
  );
}

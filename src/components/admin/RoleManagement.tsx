
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Shield } from "lucide-react";

export function RoleManagement() {
  const { userRole, updateUserRole, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || 'salesperson');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async () => {
    if (selectedRole === userRole) {
      toast.info("Role is already set to this value");
      return;
    }

    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole(user.id, selectedRole);
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsUpdating(false);
    }
  };

  if (userRole !== 'admin') {
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
                onClick={handleUpdateRole}
                disabled={isUpdating || selectedRole === userRole}
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
    </div>
  );
}

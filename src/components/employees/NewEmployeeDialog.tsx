
import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";

interface NewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeDialog({ open, onClose, onSuccess }: NewEmployeeDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    salary: "",
    hire_date: new Date().toISOString().split('T')[0],
    status: "active",
    role: "salesperson" as UserRole,
    password: "",
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if email already exists
      const { data: existingEmployee, error: checkError } = await supabase
        .from("employees")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing email:", checkError);
        throw new Error("Failed to check email availability");
      }

      if (existingEmployee) {
        toast({
          title: "Error",
          description: "An employee with this email already exists",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Generate a temporary password if not provided
      const tempPassword = formData.password || generateRandomPassword();

      console.log("Creating Supabase Auth user...");

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        }
      });

      if (authError) {
        console.error("Auth user creation error:", authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Failed to create user - no user data returned");
      }

      console.log("Auth user created successfully:", authData.user.id);

      const employeeData = {
        id: authData.user.id, // Use the auth user ID as employee ID
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        hire_date: formData.hire_date,
        status: formData.status,
        profile_id: authData.user.id,
      };

      console.log("Creating employee with data:", employeeData);

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .insert([employeeData])
        .select()
        .single();

      if (employeeError) {
        console.error("Employee creation error:", employeeError);
        // Clean up the auth user if employee creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw employeeError;
      }

      console.log("Employee created successfully:", employee);

      // The profile should already be created by the trigger, but let's verify and update if needed
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Profile check error:", profileCheckError);
      }

      if (existingProfile) {
        // Update the profile with the correct role
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ role: formData.role })
          .eq("id", authData.user.id);

        if (profileUpdateError) {
          console.error("Profile update error:", profileUpdateError);
        }
        console.log("Profile updated with role:", formData.role);
      } else {
        // Create profile if it doesn't exist (backup)
        const profileData = {
          id: authData.user.id,
          username: formData.email.split('@')[0],
          role: formData.role,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .insert([profileData]);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
        console.log("Profile created as backup");
      }

      toast({
        title: "Success",
        description: `Employee added successfully with role assigned. ${!formData.password ? `Temporary password: ${tempPassword}` : ''}`,
      });

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        salary: "",
        hire_date: new Date().toISOString().split('T')[0],
        status: "active",
        role: "salesperson",
        password: "",
      });

      onSuccess();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Leave blank for auto-generated password"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIGS).map(([roleKey, roleConfig]) => (
                  <SelectItem key={roleKey} value={roleKey}>
                    {roleConfig.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary">Salary (€)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hire_date">Hire Date *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleChange("hire_date", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

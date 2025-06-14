import React from "react";
import { useState, useEffect } from "react";
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  status: string;
  hire_date: string;
  salary?: number;
  profile_id?: string;
  profiles?: {
    role: UserRole;
  };
}

interface EditEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEmployeeDialog({ employee, open, onClose, onSuccess }: EditEmployeeDialogProps) {
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
    hire_date: "",
    status: "active",
    role: "salesperson" as UserRole,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department || "",
        position: employee.position || "",
        salary: employee.salary ? employee.salary.toString() : "",
        hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : "",
        status: employee.status || "active",
        role: employee.profiles?.role || "salesperson",
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if email is being changed and if it already exists
      if (formData.email !== employee.email) {
        const { data: existingEmployee, error: checkError } = await supabase
          .from("employees")
          .select("email")
          .eq("email", formData.email)
          .neq("id", employee.id)
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

        // Update the auth user email if it changed
        console.log("Updating auth user email...");
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          employee.id,
          {
            email: formData.email,
            user_metadata: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: formData.role
            }
          }
        );

        if (authUpdateError) {
          console.error("Auth user update error:", authUpdateError);
          throw new Error(`Failed to update user account: ${authUpdateError.message}`);
        }
        console.log("Auth user updated successfully");
      } else {
        // Update user metadata even if email didn't change
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          employee.id,
          {
            user_metadata: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              role: formData.role
            }
          }
        );

        if (authUpdateError) {
          console.error("Auth user metadata update error:", authUpdateError);
        }
      }

      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        hire_date: formData.hire_date,
        status: formData.status,
      };

      console.log("Updating employee with data:", employeeData);

      const { error: employeeError } = await supabase
        .from("employees")
        .update(employeeData)
        .eq("id", employee.id);

      if (employeeError) {
        console.error("Employee update error:", employeeError);
        throw employeeError;
      }

      console.log("Employee updated successfully");

      // Update the profile role
      if (employee.profile_id || employee.id) {
        console.log("Updating profile role to:", formData.role);
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role: formData.role })
          .eq("id", employee.profile_id || employee.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }
        console.log("Profile updated successfully");
      }

      toast({
        title: "Success",
        description: "Employee updated successfully",
      });

      onSuccess();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee",
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
          <DialogTitle>Edit Employee</DialogTitle>
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
              {isLoading ? "Updating..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/roles";

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

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary: string;
  hire_date: string;
  status: string;
  role: UserRole;
  password: string;
}

export function useEditEmployeeForm(employee: Employee) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
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
    password: "",
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
        password: "",
      });
    }
  }, [employee]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitEmployee = async (): Promise<boolean> => {
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
          return false;
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

      return true;
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChange,
    submitEmployee,
  };
}

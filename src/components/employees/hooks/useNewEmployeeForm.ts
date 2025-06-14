
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/roles";
import { generateRandomPassword } from "../utils/passwordUtils";

interface EmployeeFormData {
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

export function useNewEmployeeForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
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
  };

  const submitEmployee = async (): Promise<boolean> => {
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
        return false;
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

      resetForm();
      return true;
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee",
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
    resetForm,
  };
}

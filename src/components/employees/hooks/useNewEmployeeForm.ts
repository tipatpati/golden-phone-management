
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
      // First check if email already exists in employees table
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
      console.log("Generated temporary password for employee");

      // Create employee record without requiring Supabase Auth user creation
      // The employee will need to sign up separately or admin can create their auth account later
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
        profile_id: null, // Will be set when the employee creates their auth account
      };

      console.log("Creating employee with data:", employeeData);

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .insert([employeeData])
        .select()
        .single();

      if (employeeError) {
        console.error("Employee creation error:", employeeError);
        throw employeeError;
      }

      console.log("Employee created successfully:", employee);

      toast({
        title: "Success",
        description: `Employee added successfully! Employee will need to sign up using their email: ${formData.email}. ${!formData.password ? `Temporary password: ${tempPassword}` : ''}`,
        duration: 8000,
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


import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeFormState } from "./useEmployeeFormState";
import { EmployeeCreationService } from "../services/employeeCreationService";

export function useNewEmployeeForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { formData, handleChange, resetForm } = useEmployeeFormState();

  const submitEmployee = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Check if email already exists
      const emailExists = await EmployeeCreationService.checkEmailExists(formData.email);
      
      if (emailExists) {
        toast({
          title: "Error",
          description: "An employee with this email already exists",
          variant: "destructive",
        });
        return false;
      }

      // Create the employee with full auth account
      const { employee, tempPassword } = await EmployeeCreationService.createEmployee(formData);

      toast({
        title: "Success",
        description: `Employee ${formData.first_name} ${formData.last_name} has been created successfully! They can now log in with their email: ${formData.email}. ${!formData.password ? `Temporary password: ${tempPassword}` : ''}`,
        duration: 10000,
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

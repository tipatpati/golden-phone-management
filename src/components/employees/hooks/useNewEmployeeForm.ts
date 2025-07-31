
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeFormState } from "./useEmployeeFormState";
import { EmployeeCreationService } from "../services/employeeCreationService";
import { EmployeeFormData } from "../forms/types";

export function useNewEmployeeForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { formData, handleChange, resetForm } = useEmployeeFormState();

  const submitEmployee = async (employeeData?: EmployeeFormData): Promise<boolean> => {
    const dataToSubmit = employeeData || formData;
    setIsLoading(true);

    try {
      // Note: Email existence check is also performed by the edge function
      // which checks both the employees table and the auth system
      const emailExists = await EmployeeCreationService.checkEmailExists(dataToSubmit.email);
      
      if (emailExists) {
        toast({
          title: "Errore",
          description: "Un dipendente con questa email esiste già",
          variant: "destructive",
        });
        return false;
      }

      // Create the employee with full auth account
      const { employee, tempPassword } = await EmployeeCreationService.createEmployee(dataToSubmit);

      toast({
        title: "Successo",
        description: `Il dipendente ${dataToSubmit.first_name} ${dataToSubmit.last_name} è stato creato con successo! Ora può accedere con la sua email: ${dataToSubmit.email}. ${!dataToSubmit.password ? `Password temporanea: ${tempPassword}` : ''}`,
        duration: 10000,
      });

      resetForm();
      return true;
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiungere il dipendente",
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

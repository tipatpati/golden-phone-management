
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
      // Note: Email existence check is also performed by the edge function
      // which checks both the employees table and the auth system
      const emailExists = await EmployeeCreationService.checkEmailExists(formData.email);
      
      if (emailExists) {
        toast({
          title: "Errore",
          description: "Un dipendente con questa email esiste già",
          variant: "destructive",
        });
        return false;
      }

      // Create the employee with full auth account
      const { employee, tempPassword } = await EmployeeCreationService.createEmployee(formData);

      toast({
        title: "Successo",
        description: `Il dipendente ${formData.first_name} ${formData.last_name} è stato creato con successo! Ora può accedere con la sua email: ${formData.email}. ${!formData.password ? `Password temporanea: ${tempPassword}` : ''}`,
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

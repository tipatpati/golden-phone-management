
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/roles";
import { EmployeeFormData } from "../forms/types";
import { logger } from "@/utils/logger";

import type { Employee } from "@/services/employees/types";

// Remove the FormData interface as we're using EmployeeFormData from types

export function useEditEmployeeForm(employee: Employee) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const submitEmployee = async (employeeData: EmployeeFormData): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Check if email is being changed and if it already exists
      if (employeeData.email !== employee.email) {
        const { data: existingEmployee, error: checkError } = await supabase
          .from("employees")
          .select("email")
          .eq("email", employeeData.email)
          .neq("id", employee.id)
          .maybeSingle();

        if (checkError) {
          logger.error("Error checking existing email", { error: checkError.message }, 'EditEmployeeForm');
          throw new Error("Failed to check email availability");
        }

        if (existingEmployee) {
          toast({
            title: "Errore",
            description: "Un dipendente con questa email esiste già",
            variant: "destructive",
          });
          return false;
        }

        // Update the auth user email if it changed
        logger.info("Updating auth user email", {}, 'EditEmployeeForm');
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          employee.id,
          {
            email: employeeData.email,
            user_metadata: {
              first_name: employeeData.first_name,
              last_name: employeeData.last_name,
              role: employeeData.role
            }
          }
        );

        if (authUpdateError) {
          logger.error("Auth user update error", { error: authUpdateError.message }, 'EditEmployeeForm');
          throw new Error(`Failed to update user account: ${authUpdateError.message}`);
        }
        logger.info("Auth user updated successfully", {}, 'EditEmployeeForm');
      } else {
        // Update user metadata even if email didn't change
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          employee.id,
          {
            user_metadata: {
              first_name: employeeData.first_name,
              last_name: employeeData.last_name,
              role: employeeData.role
            }
          }
        );

        if (authUpdateError) {
          logger.error("Auth user metadata update error", { error: authUpdateError.message }, 'EditEmployeeForm');
        }
      }

      const updateData = {
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email,
        phone: employeeData.phone,
        department: employeeData.department,
        position: employeeData.position,
        salary: employeeData.salary ? parseFloat(employeeData.salary) : null,
        hire_date: employeeData.hire_date,
        status: employeeData.status,
      };

      logger.info("Updating employee with data", { employeeId: employee.id }, 'EditEmployeeForm');

      const { error: employeeError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employee.id);

      if (employeeError) {
        logger.error("Employee update error", { error: employeeError.message }, 'EditEmployeeForm');
        throw employeeError;
      }

      logger.info("Employee updated successfully", { employeeId: employee.id }, 'EditEmployeeForm');

      // Update the profile role
      if (employee.profile_id || employee.id) {
        logger.info("Updating profile role", { role: employeeData.role }, 'EditEmployeeForm');
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role: employeeData.role })
          .eq("id", employee.profile_id || employee.id);

        if (profileError) {
          logger.error("Profile update error", { error: profileError.message }, 'EditEmployeeForm');
          throw profileError;
        }
        logger.info("Profile updated successfully", {}, 'EditEmployeeForm');
      }

      toast({
        title: "Successo",
        description: "Dipendente aggiornato con successo",
      });

      return true;
    } catch (error) {
      logger.error("Error updating employee", { error }, 'EditEmployeeForm');
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare il dipendente",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    submitEmployee,
  };
}

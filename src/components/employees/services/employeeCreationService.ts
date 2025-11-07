
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormData } from "../forms/types";
import { generateRandomPassword } from "../utils/passwordUtils";
import { logger } from "@/utils/logger";

export class EmployeeCreationService {
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Check if email exists in employees table
      const { data: existingEmployee, error: checkError } = await supabase
        .from("employees")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (checkError) {
        logger.error("Error checking existing email", { error: checkError.message }, 'EmployeeCreationService');
        throw new Error("Impossibile verificare la disponibilità dell'email");
      }

      // If employee record exists, email is taken
      if (existingEmployee) {
        return true;
      }

      // Additional check: try to create a temporary auth user to see if email exists in auth system
      // This is handled by the edge function, so we'll rely on that for auth-level checking
      return false;
    } catch (error) {
      logger.error("Error in checkEmailExists", { error }, 'EmployeeCreationService');
      throw new Error("Errore nella verifica dell'email");
    }
  }

  static async createEmployee(formData: EmployeeFormData): Promise<{ employee: any; tempPassword: string }> {
    // Validate store_id is present
    if (!formData.store_id) {
      throw new Error("Il negozio è obbligatorio per creare un dipendente");
    }

    // Generate a temporary password if not provided
    const tempPassword = formData.password || generateRandomPassword();
    logger.info("Creating employee using secure edge function", {}, 'EmployeeCreationService');

    try {
      // Call the secure edge function to create auth user, profile, and role
      const { data: authResult, error: authError } = await supabase.functions.invoke('create-employee-auth', {
        body: {
          email: formData.email,
          password: tempPassword,
          role: formData.role,
          first_name: formData.first_name,
          last_name: formData.last_name,
          store_id: formData.store_id
        }
      });

      if (authError) {
        logger.error("Failed to create auth user via edge function", { error: authError.message }, 'EmployeeCreationService');
        throw new Error(`Errore nella creazione dell'utente: ${authError.message}`);
      }

      if (!authResult?.success || !authResult?.user_id) {
        const error = authResult?.error || "Nessun utente restituito dal servizio di autenticazione";
        logger.error("Edge function failed to create user", { error }, 'EmployeeCreationService');
        throw new Error(error);
      }

      const userId = authResult.user_id;
      logger.info('Auth user created via edge function, creating employee record', { userId }, 'EmployeeCreationService');

      // Create employee record (should be auto-created by trigger, but insert as fallback)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .upsert([{
          profile_id: userId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          hire_date: formData.hire_date,
          status: formData.status,
          store_id: formData.store_id
        }], {
          onConflict: 'profile_id'
        })
        .select()
        .single();

      if (employeeError) {
        logger.error("Failed to create employee record", { error: employeeError.message }, 'EmployeeCreationService');
        // Note: We cannot easily clean up the auth user created by edge function
        // The edge function handles its own cleanup on failure
        throw new Error(`Errore nella creazione del dipendente: ${employeeError.message}`);
      }

      logger.info("Employee created successfully", { employeeId: employee.id }, 'EmployeeCreationService');

      return { employee, tempPassword };

    } catch (error) {
      logger.error("Employee creation process failed", { error }, 'EmployeeCreationService');
      throw error;
    }
  }
}


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
    // Generate a temporary password if not provided
    const tempPassword = formData.password || generateRandomPassword();
    logger.info("Creating employee with auth user", {}, 'EmployeeCreationService');

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        }
      });

      if (authError) {
        logger.error("Failed to create auth user", { error: authError.message }, 'EmployeeCreationService');
        throw new Error(`Errore nella creazione dell'utente: ${authError.message}`);
      }

      if (!authData.user) {
        const error = "Nessun utente restituito dal servizio di autenticazione";
        logger.error("No user returned from auth service", {}, 'EmployeeCreationService');
        throw new Error(error);
      }

      const userId = authData.user.id;
      logger.info('Auth user created, creating employee record', { userId }, 'EmployeeCreationService');

      // Create employee record
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert({
          profile_id: userId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          hire_date: formData.hire_date,
          status: formData.status
        })
        .select()
        .single();

      if (employeeError) {
        logger.error("Failed to create employee record", { error: employeeError.message }, 'EmployeeCreationService');
        // Clean up auth user if employee creation fails
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Errore nella creazione del dipendente: ${employeeError.message}`);
      }

      // Create profile and user role
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}`,
          role: formData.role
        });

      if (profileError) {
        logger.error("Failed to create profile", { error: profileError.message }, 'EmployeeCreationService');
        // Clean up created records if profile creation fails
        await supabase.from('employees').delete().eq('profile_id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Errore nella creazione del profilo: ${profileError.message}`);
      }

      // Add role to user_roles table 
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: formData.role
        });

      if (roleError) {
        logger.warn("Failed to add user role", { error: roleError.message }, 'EmployeeCreationService');
      }

      logger.info("Employee created successfully", { employeeId: employee.id }, 'EmployeeCreationService');

      return { employee, tempPassword };

    } catch (error) {
      logger.error("Employee creation process failed", { error }, 'EmployeeCreationService');
      throw error;
    }
  }
}

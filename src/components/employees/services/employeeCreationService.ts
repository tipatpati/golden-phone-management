
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormData } from "../types/employeeForm";
import { generateRandomPassword } from "../utils/passwordUtils";

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
        console.error("Error checking existing email:", checkError);
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
      console.error("Error in checkEmailExists:", error);
      throw new Error("Errore nella verifica dell'email");
    }
  }

  static async createEmployee(formData: EmployeeFormData): Promise<{ employee: any; tempPassword: string }> {
    // Generate a temporary password if not provided
    const tempPassword = formData.password || generateRandomPassword();
    console.log("Creating employee with auth user");

    try {
      // First, create the Supabase Auth user via Edge Function
      const { data: authResponse, error: authError } = await supabase.functions.invoke(
        'create-employee-auth',
        {
          body: {
            email: formData.email,
            password: tempPassword,
            role: formData.role,
            first_name: formData.first_name,
            last_name: formData.last_name
          }
        }
      );

      if (authError || !authResponse?.success) {
        console.error('Failed to create auth user:', authError || authResponse);
        const errorMessage = authResponse?.error || authError?.message || 'Impossibile creare l\'account di autenticazione';
        throw new Error(errorMessage);
      }

      const userId = authResponse.user_id;
      console.log('Auth user created, now creating employee record for:', userId);

      // Create employee record with the auth user ID as profile_id
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
        profile_id: userId, // Link to the created auth user
      };

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .insert([employeeData])
        .select()
        .single();

      if (employeeError) {
        console.error("Employee creation error:", employeeError);
        // If employee creation fails, we should ideally clean up the auth user
        // But for now, we'll let the admin handle this manually
        throw employeeError;
      }

      console.log("Employee created successfully:", employee);

      return { employee, tempPassword };

    } catch (error) {
      console.error("Employee creation process failed:", error);
      throw error;
    }
  }
}

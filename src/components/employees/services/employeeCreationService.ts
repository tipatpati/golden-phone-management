
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormData } from "../types/employeeForm";
import { generateRandomPassword } from "../utils/passwordUtils";

export class EmployeeCreationService {
  static async checkEmailExists(email: string): Promise<boolean> {
    const { data: existingEmployee, error: checkError } = await supabase
      .from("employees")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing email:", checkError);
      throw new Error("Failed to check email availability");
    }

    return !!existingEmployee;
  }

  static async createEmployee(formData: EmployeeFormData): Promise<{ employee: any; tempPassword: string }> {
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

    return { employee, tempPassword };
  }
}

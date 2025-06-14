
import { UserRole } from "@/types/roles";

export interface EmployeeFormData {
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

export const getInitialFormData = (): EmployeeFormData => ({
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

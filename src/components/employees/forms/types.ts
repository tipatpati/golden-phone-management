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
  store_id: string;
}

export const getInitialEmployeeFormData = (): EmployeeFormData => ({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department: "Vendite", // Default department
  position: "Venditore", // Default position
  salary: "",
  hire_date: new Date().toISOString().split('T')[0],
  status: "active",
  role: "salesperson" as UserRole,
  password: "",
  store_id: "", // Will be set by the form component
});

export const EMPLOYEE_DEPARTMENTS = [
  "Vendite",
  "Inventario", 
  "Riparazioni",
  "Amministrazione",
  "IT",
  "Finanze",
  "Risorse Umane"
] as const;

export const EMPLOYEE_POSITIONS = [
  "Venditore",
  "Manager Vendite",
  "Responsabile Inventario", 
  "Tecnico Riparazioni",
  "Responsabile IT",
  "Amministratore",
  "Contabile",
  "Responsabile HR"
] as const;

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Attivo" },
  { value: "inactive", label: "Inattivo" },
  { value: "terminated", label: "Licenziato" }
] as const;
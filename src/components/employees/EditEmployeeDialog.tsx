import React from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { useEditEmployeeForm } from "./hooks/useEditEmployeeForm";
import { EmployeeForm } from "./forms/EmployeeForm";
import { useEmployeeForm } from "./forms/hooks/useEmployeeForm";
import { UserRole } from "@/types/roles";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  status: string;
  hire_date: string;
  salary?: number;
  profile_id?: string;
  profiles?: {
    role: UserRole;
  };
}

interface EditEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEmployeeDialog({ employee, open, onClose, onSuccess }: EditEmployeeDialogProps) {
  const { formData, errors, handleChange, handleBlur, isValid } = useEmployeeForm({
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email || "",
    phone: employee.phone || "",
    department: employee.department || "",
    position: employee.position || "",
    salary: employee.salary?.toString() || "",
    hire_date: employee.hire_date,
    status: employee.status,
    role: employee.profiles?.role || "salesperson",
    password: ""
  });
  
  const { submitEmployee, isLoading } = useEditEmployeeForm(employee);

  const handleSubmit = async () => {
    if (!isValid()) return;
    
    const success = await submitEmployee(formData);
    if (success) {
      onSuccess();
    }
  };

  return (
    <FormDialog
      title={`Modifica ${employee.first_name} ${employee.last_name}`}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Aggiorna Dipendente"
      maxWidth="md"
    >
      <EmployeeForm
        formData={formData}
        errors={errors}
        onFieldChange={handleChange}
        onFieldBlur={handleBlur}
        showPassword={false}
      />
    </FormDialog>
  );
}
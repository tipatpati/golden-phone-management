import React from "react";
import { BaseDialog } from "@/components/common";
import { useEditEmployeeForm } from "./hooks/useEditEmployeeForm";
import { EmployeeFormFields } from "./components/EmployeeFormFields";
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
  const { formData, isLoading, handleChange, submitEmployee } = useEditEmployeeForm(employee);

  const handleSubmit = async () => {
    const success = await submitEmployee();
    if (success) {
      onSuccess();
    }
  };

  return (
    <BaseDialog
      title={`Edit ${employee.first_name} ${employee.last_name}`}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Update Employee"
      maxWidth="md"
    >
      <EmployeeFormFields
        formData={formData}
        onFieldChange={handleChange}
        showPassword={false}
      />
    </BaseDialog>
  );
}
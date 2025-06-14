
import { useState } from "react";
import { EmployeeFormData, getInitialFormData } from "../types/employeeForm";

export function useEmployeeFormState() {
  const [formData, setFormData] = useState<EmployeeFormData>(getInitialFormData());

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  return {
    formData,
    handleChange,
    resetForm,
  };
}

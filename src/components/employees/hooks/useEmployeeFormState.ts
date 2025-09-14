
import { useState } from "react";
import { EmployeeFormData, getInitialEmployeeFormData } from "../forms/types";

export function useEmployeeFormState() {
  const [formData, setFormData] = useState<EmployeeFormData>(getInitialEmployeeFormData());

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(getInitialEmployeeFormData());
  };

  return {
    formData,
    handleChange,
    resetForm,
  };
}

import React from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { useNewEmployeeForm } from "./hooks/useNewEmployeeForm";
import { EmployeeForm } from "./forms/EmployeeForm";
import { useEmployeeForm } from "./forms/hooks/useEmployeeForm";

interface NewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeDialog({ open, onClose, onSuccess }: NewEmployeeDialogProps) {
  const { formData, errors, handleChange, handleBlur, isValid, resetForm } = useEmployeeForm();
  const { submitEmployee, isLoading } = useNewEmployeeForm();

  const handleSubmit = async () => {
    if (!isValid()) return;
    
    const success = await submitEmployee(formData);
    if (success) {
      resetForm();
      onSuccess();
    }
  };

  return (
    <FormDialog
      title="Aggiungi Nuovo Dipendente"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Aggiungi Dipendente"
      size="md"
    >
      <EmployeeForm
        formData={formData}
        errors={errors}
        onFieldChange={handleChange}
        onFieldBlur={handleBlur}
        showPassword={true}
      />
    </FormDialog>
  );
}
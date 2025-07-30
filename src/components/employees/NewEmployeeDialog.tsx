import React from "react";
import { BaseDialog } from "@/components/common";
import { useNewEmployeeForm } from "./hooks/useNewEmployeeForm";
import { EmployeeFormFields } from "./components/EmployeeFormFields";

interface NewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeDialog({ open, onClose, onSuccess }: NewEmployeeDialogProps) {
  const { formData, isLoading, handleChange, submitEmployee } = useNewEmployeeForm();

  const handleSubmit = async () => {
    const success = await submitEmployee();
    if (success) {
      onSuccess();
    }
  };

  return (
    <BaseDialog
      title="Aggiungi Nuovo Dipendente"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Aggiungi Dipendente"
      maxWidth="md"
    >
      <EmployeeFormFields
        formData={formData}
        onFieldChange={handleChange}
        showPassword={true}
      />
    </BaseDialog>
  );
}
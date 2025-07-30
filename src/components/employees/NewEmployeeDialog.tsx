
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNewEmployeeForm } from "./hooks/useNewEmployeeForm";
import { EmployeeFormFields } from "./components/EmployeeFormFields";

interface NewEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeDialog({ open, onClose, onSuccess }: NewEmployeeDialogProps) {
  const { formData, isLoading, handleChange, submitEmployee } = useNewEmployeeForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitEmployee();
    if (success) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Dipendente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <EmployeeFormFields
            formData={formData}
            onFieldChange={handleChange}
            showPassword={true}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Aggiunta..." : "Aggiungi Dipendente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <EmployeeFormFields
            formData={formData}
            onFieldChange={handleChange}
            showPassword={false}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Updating..." : "Update Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

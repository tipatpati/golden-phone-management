
import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/enhanced-button";
import {
  Dialog,
  EnhancedDialogContent as DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/enhanced-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { log } from "@/utils/logger";
import type { Employee } from "@/services/employees/types";

interface DeleteEmployeeDialogProps {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteEmployeeDialog({ employee, open, onClose, onSuccess }: DeleteEmployeeDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employee.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });

      onSuccess();
    } catch (error) {
      log.error("Error deleting employee", error, "DeleteEmployeeDialog");
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <DialogTitle>Delete Employee</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{employee.first_name} {employee.last_name}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            type="button" 
            variant="outlined" 
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] text-base"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            disabled={isLoading}
            variant="destructive"
            className="w-full sm:w-auto min-h-[44px] text-base"
          >
            {isLoading ? "Deleting..." : "Delete Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

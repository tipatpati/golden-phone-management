
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Employee {
  id: string;
  username: string;
  role: string;
}

interface DeleteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteEmployeeDialog({ 
  open, 
  onOpenChange, 
  employee, 
  onConfirm, 
  isLoading 
}: DeleteEmployeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Employee
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to delete <strong>{employee.username}</strong>? 
            This action cannot be undone and will permanently remove the employee 
            from the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Employee'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

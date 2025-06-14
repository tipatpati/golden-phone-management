
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';

interface Employee {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

export function EditEmployeeDialog({ open, onOpenChange, employee }: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    username: employee.username,
    role: employee.role,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    setFormData({
      username: employee.username,
      role: employee.role,
    });
  }, [employee]);

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          role: data.role,
        })
        .eq('id', employee.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Update employee error:', error);
      toast.error('Failed to update employee', {
        description: error.message || 'Please try again later'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) {
      toast.error('Username is required');
      return;
    }
    updateEmployeeMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="john_doe"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateEmployeeMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateEmployeeMutation.isPending}>
              {updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

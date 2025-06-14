
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';

interface NewEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewEmployeeDialog({ open, onOpenChange }: NewEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'salesperson' as UserRole,
  });
  const queryClient = useQueryClient();

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create user with admin API
      const { data: user, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            role: data.role,
          }
        }
      });

      if (error) throw error;
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
      onOpenChange(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'salesperson',
      });
    },
    onError: (error: any) => {
      console.error('Create employee error:', error);
      toast.error('Failed to create employee', {
        description: error.message || 'Please try again later'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    createEmployeeMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="employee@company.com"
              required
            />
          </div>
          
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
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
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
              disabled={createEmployeeMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createEmployeeMutation.isPending}>
              {createEmployeeMutation.isPending ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

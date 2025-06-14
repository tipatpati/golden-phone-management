
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, ROLE_CONFIGS } from '@/types/roles';
import { NewEmployeeDialog } from '@/components/employees/NewEmployeeDialog';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { DeleteEmployeeDialog } from '@/components/employees/DeleteEmployeeDialog';

type Employee = {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  email?: string;
};

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(employeeId);
      if (error) throw error;
      
      // Also delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      console.error('Delete employee error:', error);
      toast.error('Failed to delete employee', {
        description: error.message || 'Please try again later'
      });
    },
  });

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'inventory_manager':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'salesperson':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Employee Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your team members and their roles</p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="sm:inline">Add Employee</span>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="h-5 w-5" />
              Employees ({employees.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No employees found
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">{employee.username}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          ID: {employee.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <Badge className={`${getRoleBadgeColor(employee.role)} text-xs`}>
                        {ROLE_CONFIGS[employee.role]?.name || employee.role}
                      </Badge>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(employee)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <NewEmployeeDialog
          open={isNewDialogOpen}
          onOpenChange={setIsNewDialogOpen}
        />
        
        {selectedEmployee && (
          <>
            <EditEmployeeDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              employee={selectedEmployee}
            />
            
            <DeleteEmployeeDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              employee={selectedEmployee}
              onConfirm={confirmDelete}
              isLoading={deleteEmployeeMutation.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}

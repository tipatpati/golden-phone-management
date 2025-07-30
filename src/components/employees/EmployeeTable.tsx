
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, User, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { ROLE_CONFIGS } from "@/types/roles";

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
  profiles?: {
    role: string;
  };
}

interface EmployeeRowProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onRefresh: () => void;
}

function EmployeeCard({ employee, onEdit, onDelete }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRoleName = (role: string) => {
    return ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS]?.name || role;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 touch-target border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-2 md:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg">
              <User className="h-5 w-5 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-base text-on-surface truncate leading-tight">
                {employee.first_name} {employee.last_name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs md:text-xs text-muted-foreground">
                  {employee.email}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant={getStatusColor(employee.status)}
            className="text-xs md:text-xs font-semibold px-1.5 py-0.5"
          >
            {employee.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2 md:space-y-2">
        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <p className="text-xs md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</p>
            <p className="text-xs md:text-xs font-medium text-on-surface">
              {getRoleName(employee.profiles?.role || "salesperson")}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Department</p>
            <p className="text-xs md:text-xs font-medium text-on-surface">
              {employee.department || "N/A"}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Position</p>
            <p className="text-xs md:text-xs font-medium text-on-surface">
              {employee.position || "N/A"}
            </p>
          </div>
        </div>

        {/* Additional Information */}
        {(employee.hire_date || employee.salary) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-outline/20">
            {employee.hire_date && (
              <div className="space-y-0.5">
                <p className="text-xs md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Hire Date</p>
                <p className="text-xs md:text-xs font-medium text-on-surface">
                  {new Date(employee.hire_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {employee.salary && (
              <div className="space-y-0.5">
                <p className="text-xs md:text-xs font-medium text-muted-foreground uppercase tracking-wide">Salary</p>
                <p className="text-base md:text-lg font-bold text-primary">
                  €{employee.salary.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-1.5 pt-2 border-t">
          <Button 
            variant="default" 
            size="sm"
            className="flex-1 md:flex-none touch-button h-8 md:h-7 text-xs font-medium"
            onClick={() => onEdit(employee)}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 touch-button h-8 md:h-7 text-xs font-medium px-2"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{employee.first_name} {employee.last_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(employee)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeRow({ employee, onEdit, onDelete }: EmployeeRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "terminated":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRoleName = (role: string) => {
    return ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS]?.name || role;
  };

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-container-high transition-colors">
      {/* Employee Name */}
      <div className="col-span-2">
        <div className="font-medium text-on-surface truncate">{employee.first_name} {employee.last_name}</div>
      </div>

      {/* Email */}
      <div className="col-span-2">
        <div className="text-on-surface text-sm truncate">{employee.email}</div>
      </div>

      {/* Role */}
      <div className="col-span-1">
        <Badge variant="outline" className="text-xs">
          {getRoleName(employee.profiles?.role || "salesperson")}
        </Badge>
      </div>

      {/* Department */}
      <div className="col-span-1">
        <div className="text-on-surface text-sm truncate">{employee.department || "-"}</div>
      </div>

      {/* Position */}
      <div className="col-span-1">
        <div className="text-on-surface text-sm truncate">{employee.position || "-"}</div>
      </div>

      {/* Status */}
      <div className="col-span-1">
        <Badge variant={getStatusColor(employee.status)}>
          {employee.status}
        </Badge>
      </div>

      {/* Hire Date */}
      <div className="col-span-1 text-right">
        <div className="text-on-surface text-sm">
          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "-"}
        </div>
      </div>

      {/* Salary */}
      <div className="col-span-1 text-right">
        <div className="font-medium text-on-surface text-sm">
          {employee.salary ? `€${employee.salary.toLocaleString()}` : "-"}
        </div>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(employee)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{employee.first_name} {employee.last_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(employee)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function EmployeeTable({ employees, isLoading, onEdit, onRefresh }: EmployeeTableProps) {
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteEmployee(employee);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="bg-surface rounded-xl border border-outline overflow-hidden hidden lg:block">
        {/* Table Header */}
        <div className="bg-surface-container border-b border-outline">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-on-surface-variant">
            <div className="col-span-2">Employee</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1">Role</div>
            <div className="col-span-1">Department</div>
            <div className="col-span-1">Position</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Hire Date</div>
            <div className="col-span-1 text-right">Salary</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-outline">
          {employees.map((employee) => (
            <EmployeeRow
              key={employee.id}
              employee={employee}
              onEdit={onEdit}
              onDelete={handleDeleteEmployee}
            />
          ))}
        </div>
      </div>

      {/* Tablet/Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={onEdit}
            onDelete={handleDeleteEmployee}
          />
        ))}
      </div>

      {deleteEmployee && (
        <DeleteEmployeeDialog
          employee={deleteEmployee}
          open={!!deleteEmployee}
          onClose={() => setDeleteEmployee(null)}
          onSuccess={() => {
            onRefresh();
            setDeleteEmployee(null);
          }}
        />
      )}
    </>
  );
}

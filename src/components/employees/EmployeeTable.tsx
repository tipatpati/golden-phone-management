
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, User } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog } from "@/components/common";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { ROLE_CONFIGS } from "@/types/roles";
import type { Employee } from "@/services/employees/types";

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

export function EmployeeTable({ employees, isLoading, onEdit, onRefresh }: EmployeeTableProps) {
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Employee>();

  const handleDeleteEmployee = (employee: Employee) => {
    showConfirmDialog({
      item: employee,
      title: "Delete Employee",
      message: `Are you sure you want to delete "${employee.first_name} ${employee.last_name}"? This action cannot be undone.`,
      onConfirm: () => setDeleteEmployee(employee)
    });
  };

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

  // Define table columns for desktop view
  const columns = [
    {
      key: 'name' as keyof Employee,
      header: 'Employee',
      render: (value: any, employee: Employee) => (
        <div className="font-medium truncate">
          {employee.first_name} {employee.last_name}
        </div>
      )
    },
    {
      key: 'email' as keyof Employee,
      header: 'Email',
      render: (value: string) => (
        <div className="text-sm truncate">{value}</div>
      )
    },
    {
      key: 'profiles' as keyof Employee,
      header: 'Role',
      render: (value: any, employee: Employee) => (
        <Badge variant="outline" className="text-xs">
          {getRoleName(employee.profiles?.role || "salesperson")}
        </Badge>
      )
    },
    {
      key: 'department' as keyof Employee,
      header: 'Department',
      render: (value: string) => value || "-"
    },
    {
      key: 'position' as keyof Employee,
      header: 'Position',
      render: (value: string) => value || "-"
    },
    {
      key: 'status' as keyof Employee,
      header: 'Status',
      render: (value: string) => (
        <Badge variant={getStatusColor(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'hire_date' as keyof Employee,
      header: 'Hire Date',
      align: 'right' as const,
      render: (value: string) => 
        value ? new Date(value).toLocaleDateString() : "-"
    },
    {
      key: 'salary' as keyof Employee,
      header: 'Salary',
      align: 'right' as const,
      render: (value: number) => 
        value ? `€${value.toLocaleString()}` : "-"
    }
  ];

  // Define actions for both table and cards
  const actions = [
    {
      icon: <Edit2 className="h-4 w-4" />,
      label: "Edit",
      onClick: (employee: Employee) => onEdit(employee)
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      onClick: handleDeleteEmployee,
      variant: "destructive" as const
    }
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={employees}
          columns={columns}
          actions={actions}
          getRowKey={(employee) => employee.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
        {employees.map((employee) => (
          <DataCard
            key={employee.id}
            title={`${employee.first_name} ${employee.last_name}`}
            subtitle={employee.email}
            icon={<User className="h-5 w-5 text-primary" />}
            badge={{
              text: employee.status,
              variant: getStatusColor(employee.status) as any
            }}
            fields={[
              {
                label: "Role",
                value: getRoleName(employee.profiles?.role || "salesperson")
              },
              {
                label: "Department",
                value: employee.department || "N/A"
              },
              {
                label: "Position",
                value: employee.position || "N/A"
              },
              ...(employee.hire_date ? [{
                label: "Hire Date",
                value: new Date(employee.hire_date).toLocaleDateString()
              }] : []),
              ...(employee.salary ? [{
                label: "Salary",
                value: <span className="text-base font-bold text-primary">€{employee.salary.toLocaleString()}</span>
              }] : [])
            ]}
            actions={[
              {
                icon: <Edit2 className="h-3 w-3 mr-1" />,
                label: "Edit",
                onClick: () => onEdit(employee)
              },
              {
                icon: <Trash2 className="h-3 w-3 mr-1" />,
                label: "Delete",
                onClick: () => handleDeleteEmployee(employee),
                variant: "outline",
                className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              }
            ]}
          />
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={confirmAction}
        title={dialogState.title}
        message={dialogState.message}
        variant="destructive"
        confirmText="Delete"
      />

      {/* Delete Dialog */}
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

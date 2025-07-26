
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Trash2 } from "lucide-react";
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

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onRefresh: () => void;
}

export function EmployeeTable({ employees, isLoading, onEdit, onRefresh }: EmployeeTableProps) {
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleName = (role: string) => {
    return ROLE_CONFIGS[role as keyof typeof ROLE_CONFIGS]?.name || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading employees...</div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">No employees found</div>
          <div className="text-gray-500">Add your first employee to get started</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow interactive={false}>
              <TableHead sortable>Name</TableHead>
              <TableHead sortable>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell" align="right">Hire Date</TableHead>
              <TableHead className="hidden lg:table-cell" align="right">Salary</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium text-sm">
                  <div className="flex flex-col">
                    <span>{employee.first_name} {employee.last_name}</span>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {employee.department || "No dept"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col">
                    <span>{employee.email}</span>
                    <span className="text-xs text-muted-foreground md:hidden">
                      {employee.position || "No position"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getRoleName(employee.profiles?.role || "salesperson")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{employee.department || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">{employee.position || "-"}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(employee.status)} text-xs`}>
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell" align="right">
                  {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell" align="right">
                  {employee.salary ? `€${employee.salary.toLocaleString()}` : "-"}
                </TableCell>
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(employee)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteEmployee(employee)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

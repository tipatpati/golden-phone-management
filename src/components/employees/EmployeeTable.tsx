
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, Phone } from "lucide-react";
import { DeleteEmployeeDialog } from "./DeleteEmployeeDialog";
import { useState } from "react";

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
}

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onRefresh: () => void;
}

export function EmployeeTable({ employees, isLoading, onEdit, onRefresh }: EmployeeTableProps) {
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-yellow-100 text-yellow-800",
      terminated: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return "N/A";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">No employees found</div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Contact</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead className="hidden sm:table-cell">Hire Date</TableHead>
              <TableHead className="hidden lg:table-cell">Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="text-sm text-gray-500 sm:hidden">
                      {employee.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      {employee.email}
                    </div>
                    {employee.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        {employee.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {employee.department || "N/A"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {employee.position || "N/A"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatDate(employee.hire_date)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatSalary(employee.salary)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(employee.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingEmployee(employee)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deletingEmployee && (
        <DeleteEmployeeDialog
          employee={deletingEmployee}
          open={!!deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onSuccess={() => {
            onRefresh();
            setDeletingEmployee(null);
          }}
        />
      )}
    </>
  );
}

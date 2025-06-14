
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { NewEmployeeDialog } from "@/components/employees/NewEmployeeDialog";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { useEmployees } from "@/services/useEmployees";

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const { data: employees = [], isLoading, refetch } = useEmployees();

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage your team members and their information</p>
        </div>
        <Button
          onClick={() => setIsNewEmployeeOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        <EmployeeTable
          employees={filteredEmployees}
          isLoading={isLoading}
          onEdit={setEditingEmployee}
          onRefresh={refetch}
        />
      </div>

      <NewEmployeeDialog
        open={isNewEmployeeOpen}
        onClose={() => setIsNewEmployeeOpen(false)}
        onSuccess={() => {
          refetch();
          setIsNewEmployeeOpen(false);
        }}
      />

      {editingEmployee && (
        <EditEmployeeDialog
          employee={editingEmployee}
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => {
            refetch();
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

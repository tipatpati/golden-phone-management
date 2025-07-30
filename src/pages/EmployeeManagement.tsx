
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { NewEmployeeDialog } from "@/components/employees/NewEmployeeDialog";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { useEmployees } from "@/services";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { SecurityAuditLog } from "@/components/security/SecurityAuditLog";
import { SecurityAlerts } from "@/components/security/SecurityAlerts";
import { SecurityDashboard } from "@/components/security/SecurityDashboard";

export default function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const { data: employees = [], isLoading, refetch } = useEmployees();

  // Type cast the data array
  const employeesArray = (employees as any[]) || [];
  const filteredEmployees = employeesArray.filter((employee) => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen p-3 sm:p-6">
      {/* Security Alerts */}
      <SecurityAlerts />
      
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-muted-foreground mt-2 sm:mt-3 text-base sm:text-lg">
              Manage your team members and security settings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="employees" className="w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 border-0">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="employees" className="text-xs sm:text-sm p-2 sm:p-3">Employees</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs sm:text-sm p-2 sm:p-3">Roles</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm p-2 sm:p-3">Security</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm p-2 sm:p-3">Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="space-y-4 sm:space-y-6 mt-0">
            {/* Add Employee Button */}
            <div className="flex justify-end">
            <Button
              onClick={() => setIsNewEmployeeOpen(true)}
              size="default"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
            </Button>
            </div>

            {/* Search and Filter */}
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[100px]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
              <EmployeeTable
                employees={filteredEmployees}
                isLoading={isLoading}
                onEdit={setEditingEmployee}
                onRefresh={refetch}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="mt-0">
            <RoleManagement />
          </TabsContent>
          
          <TabsContent value="security" className="mt-0">
            <SecurityDashboard />
          </TabsContent>
          
          <TabsContent value="audit" className="mt-0">
            <SecurityAuditLog />
          </TabsContent>
        </div>
      </Tabs>

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

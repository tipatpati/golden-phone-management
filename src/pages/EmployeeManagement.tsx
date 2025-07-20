
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { NewEmployeeDialog } from "@/components/employees/NewEmployeeDialog";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { useEmployees } from "@/services/useEmployees";
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

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Security Alerts */}
          <SecurityAlerts />
          
          {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Management
              </h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Manage your team members and security settings
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="security">Security Dashboard</TabsTrigger>
            <TabsTrigger value="audit">Security Audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="space-y-6">
            <div className="flex justify-center mb-6">
              <Button
                onClick={() => setIsNewEmployeeOpen(true)}
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
              >
                <Plus className="h-5 w-5 mr-3" />
                Add New Employee
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
            <div className="bg-white rounded-2xl shadow-xl border-0">
              <EmployeeTable
                employees={filteredEmployees}
                isLoading={isLoading}
                onEdit={setEditingEmployee}
                onRefresh={refetch}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement />
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <SecurityDashboard />
          </TabsContent>
          
          <TabsContent value="audit" className="space-y-4">
            <SecurityAuditLog />
          </TabsContent>
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
    </div>
  );
}

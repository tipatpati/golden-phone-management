import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus,
  Download,
  Users,
  BarChart3
} from "lucide-react";
import { EmployeeCard, EmployeeMetrics } from "./ui";
import { EmployeeTable } from "./EmployeeTable";
import { useEmployeeStatistics, useEmployeeFilters } from "../../services/employees/OptimizedEmployeeService";
import type { Employee } from "@/services/employees/types";
import { EMPLOYEE_DEPARTMENTS, EMPLOYEE_POSITIONS, EMPLOYEE_STATUS_OPTIONS } from "./forms/types";

interface EnhancedEmployeesListProps {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onRefresh: () => void;
  onAddNew: () => void;
}

type ViewMode = 'table' | 'grid' | 'metrics';

export function EnhancedEmployeesList({
  employees,
  isLoading,
  onEdit,
  onDelete,
  onRefresh,
  onAddNew
}: EnhancedEmployeesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const statistics = useEmployeeStatistics();
  const filters = useEmployeeFilters();

  const filteredEmployees = useMemo(() => {
    let result = employees;

    // Apply search filter
    if (searchTerm) {
      result = filters.search(searchTerm);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(emp => emp.status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      result = result.filter(emp => emp.department === departmentFilter);
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter(emp => emp.profiles?.role === roleFilter);
    }

    return result;
  }, [employees, searchTerm, statusFilter, departmentFilter, roleFilter, filters]);

  const availableDepartments = useMemo(() => {
    return [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  }, [employees]);

  const availableRoles = useMemo(() => {
    return [...new Set(employees.map(emp => emp.profiles?.role).filter(Boolean))];
  }, [employees]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting employees...', filteredEmployees);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setRoleFilter("all");
  };

  const activeFiltersCount = [
    searchTerm,
    statusFilter !== "all" ? statusFilter : null,
    departmentFilter !== "all" ? departmentFilter : null,
    roleFilter !== "all" ? roleFilter : null
  ].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Caricamento dipendenti...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestione Dipendenti</h2>
          <p className="text-muted-foreground">
            {filteredEmployees.length} di {employees.length} dipendenti
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} filtri attivi
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <Button onClick={onAddNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Dipendente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtri e Ricerca</span>
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Cancella Filtri
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca dipendenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli Stati</SelectItem>
                {EMPLOYEE_STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Dipartimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Dipartimenti</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Ruoli</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Tabella</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center space-x-2">
            <Grid className="h-4 w-4" />
            <span>Griglia</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Metriche</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <EmployeeTable
                employees={filteredEmployees as any}
                isLoading={false}
                onEdit={onEdit as any}
                onRefresh={onRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="mt-6">
          {filteredEmployees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun dipendente trovato</h3>
                <p className="text-muted-foreground text-center">
                  Prova a modificare i filtri di ricerca o aggiungi un nuovo dipendente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <EmployeeMetrics statistics={statistics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
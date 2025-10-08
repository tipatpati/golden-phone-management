import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/enhanced-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/enhanced-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building, Calendar, Edit, Trash2 } from "lucide-react";
import { Employee } from "@/services/employees/types";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";

interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  compact?: boolean;
}

export function EmployeeCard({ employee, onEdit, onDelete, compact = false }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'inactive': return 'Inattivo';
      case 'terminated': return 'Licenziato';
      default: return status;
    }
  };

  const getRoleName = (role: UserRole | string) => {
    return ROLE_CONFIGS[role as UserRole]?.name || role;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return '-';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(salary);
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">
                  {getInitials(employee.first_name, employee.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-xs text-muted-foreground">{employee.position || 'N/A'}</p>
              </div>
            </div>
            <Badge className={getStatusColor(employee.status)}>
              {getStatusLabel(employee.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getRoleName(employee.profiles?.role || "salesperson")}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(employee.status)}>
            {getStatusLabel(employee.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {employee.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{employee.email}</span>
            </div>
          )}
          
          {employee.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Telefono:</span>
              <span className="font-medium">{employee.phone}</span>
            </div>
          )}
          
          {employee.department && (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dipartimento:</span>
              <span className="font-medium">{employee.department}</span>
            </div>
          )}
          
          {employee.hire_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assunto:</span>
              <span className="font-medium">{formatDate(employee.hire_date)}</span>
            </div>
          )}
          
          {employee.position && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Posizione:</span>
              <span className="font-medium">{employee.position}</span>
            </div>
          )}
          
          {employee.salary && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Stipendio:</span>
              <span className="font-medium">{formatSalary(employee.salary)}</span>
            </div>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onEdit && (
              <Button
                variant="outlined"
                size="sm"
                onClick={() => onEdit(employee)}
                className="flex items-center space-x-1"
              >
                <Edit className="h-4 w-4" />
                <span>Modifica</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outlined"
                size="sm"
                onClick={() => onDelete(employee)}
                className="flex items-center space-x-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Elimina</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Euro,
  Shield,
  MapPin,
  Clock
} from "lucide-react";
import { Employee } from "@/services/employees/types";
import { UserRole, ROLE_CONFIGS } from "@/types/roles";

interface EmployeeDetailsViewProps {
  employee: Employee;
  className?: string;
}

export function EmployeeDetailsView({ employee, className }: EmployeeDetailsViewProps) {
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
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Non specificato';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(salary);
  };

  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} giorni`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mese' : 'mesi'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} ${years === 1 ? 'anno' : 'anni'}${remainingMonths > 0 ? ` e ${remainingMonths} ${remainingMonths === 1 ? 'mese' : 'mesi'}` : ''}`;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl font-bold">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {employee.first_name} {employee.last_name}
                  </CardTitle>
                  <p className="text-lg text-muted-foreground mt-1">
                    {getRoleName(employee.profiles?.role || "salesperson")}
                  </p>
                  {employee.position && (
                    <p className="text-sm text-muted-foreground">
                      {employee.position}
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(employee.status)}>
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informazioni di Contatto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
              </div>
            )}
            
            {employee.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{employee.phone}</p>
                </div>
              </div>
            )}
            
            {!employee.email && !employee.phone && (
              <p className="text-sm text-muted-foreground">
                Nessuna informazione di contatto disponibile
              </p>
            )}
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Informazioni Lavorative</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.department && (
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dipartimento</p>
                  <p className="font-medium">{employee.department}</p>
                </div>
              </div>
            )}
            
            {employee.profiles?.role && (
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Ruolo Sistema</p>
                  <p className="font-medium">{getRoleName(employee.profiles.role)}</p>
                </div>
              </div>
            )}
            
            {employee.salary && (
              <div className="flex items-center space-x-3">
                <Euro className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stipendio</p>
                  <p className="font-medium">{formatSalary(employee.salary)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Dettagli Impiego</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.hire_date && (
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data di Assunzione</p>
                  <p className="font-medium">{formatDate(employee.hire_date)}</p>
                </div>
              </div>
            )}
            
            {employee.hire_date && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Anzianità</p>
                  <p className="font-medium">{calculateTenure(employee.hire_date)}</p>
                </div>
              </div>
            )}
            
            {employee.employee_id && (
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ID Dipendente</p>
                  <p className="font-medium">{employee.employee_id}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Informazioni Aggiuntive</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Note</p>
                <p className="text-sm">{employee.notes}</p>
              </div>
            )}
            
            {employee.created_at && (
              <div>
                <p className="text-sm text-muted-foreground">Creato il</p>
                <p className="font-medium text-sm">
                  {formatDate(employee.created_at)}
                </p>
              </div>
            )}
            
            {employee.updated_at && (
              <div>
                <p className="text-sm text-muted-foreground">Ultimo aggiornamento</p>
                <p className="font-medium text-sm">
                  {formatDate(employee.updated_at)}
                </p>
              </div>
            )}
            
            {!employee.notes && (
              <p className="text-sm text-muted-foreground">
                Nessuna informazione aggiuntiva disponibile
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
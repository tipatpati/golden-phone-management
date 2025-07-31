import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  UserX, 
  Building, 
  TrendingUp,
  Calendar,
  Euro
} from "lucide-react";

interface EmployeeMetricsProps {
  statistics: {
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    departments: string[];
    positions: string[];
    averageSalary: number;
    recentHires: number;
  };
  className?: string;
}

export function EmployeeMetrics({ statistics, className }: EmployeeMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusPercentage = (count: number) => {
    return statistics.total > 0 ? (count / statistics.total) * 100 : 0;
  };

  const metrics = [
    {
      title: "Totale Dipendenti",
      value: statistics.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      trend: null
    },
    {
      title: "Dipendenti Attivi",
      value: statistics.active,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      trend: `${getStatusPercentage(statistics.active).toFixed(1)}%`
    },
    {
      title: "Dipendenti Inattivi",
      value: statistics.inactive,
      icon: UserMinus,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      trend: `${getStatusPercentage(statistics.inactive).toFixed(1)}%`
    },
    {
      title: "Dipendenti Licenziati",
      value: statistics.terminated,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      trend: `${getStatusPercentage(statistics.terminated).toFixed(1)}%`
    }
  ];

  const additionalMetrics = [
    {
      title: "Dipartimenti",
      value: statistics.departments.length,
      icon: Building,
      description: "Dipartimenti attivi"
    },
    {
      title: "Nuove Assunzioni",
      value: statistics.recentHires,
      icon: Calendar,
      description: "Ultimi 30 giorni"
    },
    {
      title: "Stipendio Medio",
      value: formatCurrency(statistics.averageSalary),
      icon: Euro,
      description: "Media annuale"
    },
    {
      title: "Crescita Team",
      value: "+12%",
      icon: TrendingUp,
      description: "Rispetto al mese scorso"
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-3xl font-bold">{metric.value}</p>
                  {metric.trend && (
                    <Badge variant="secondary" className="mt-2">
                      {metric.trend}
                    </Badge>
                  )}
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Distribuzione Stato Dipendenti</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Attivi</span>
              <span className="text-sm text-muted-foreground">
                {statistics.active} ({getStatusPercentage(statistics.active).toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={getStatusPercentage(statistics.active)} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inattivi</span>
              <span className="text-sm text-muted-foreground">
                {statistics.inactive} ({getStatusPercentage(statistics.inactive).toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={getStatusPercentage(statistics.inactive)} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Licenziati</span>
              <span className="text-sm text-muted-foreground">
                {statistics.terminated} ({getStatusPercentage(statistics.terminated).toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={getStatusPercentage(statistics.terminated)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {additionalMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Dipartimenti Attivi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statistics.departments.map((department, index) => (
              <Badge key={index} variant="outline">
                {department}
              </Badge>
            ))}
            {statistics.departments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nessun dipartimento configurato
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
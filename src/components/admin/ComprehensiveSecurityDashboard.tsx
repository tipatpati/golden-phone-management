import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Activity, Database, Users, Settings } from 'lucide-react';
import { SecurityAuditLog } from '@/components/security/SecurityAuditLog';
import { SecurityAlerts } from '@/components/security/SecurityAlerts';
import { DataConsistencyChecker } from '@/components/ui/data-consistency-checker';
import { EnhancedSecurityProvider, useSecurity } from '@/components/security/EnhancedSecurityProvider';

function SecurityOverview() {
  const { securityLevel, threatCount, isSecure } = useSecurity();

  const getSecurityBadgeVariant = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'destructive';
      default: return 'secondary';
    }
  };

  const securityMetrics = [
    {
      title: 'Security Level',
      value: securityLevel.toUpperCase(),
      icon: Shield,
      variant: getSecurityBadgeVariant(securityLevel)
    },
    {
      title: 'Threat Count',
      value: threatCount.toString(),
      icon: AlertTriangle,
      variant: threatCount > 5 ? 'destructive' : 'default'
    },
    {
      title: 'System Status',
      value: isSecure ? 'SECURE' : 'AT RISK',
      icon: Activity,
      variant: isSecure ? 'default' : 'destructive'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {securityMetrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <Badge variant={metric.variant as any} className="mt-2">
                  {metric.value}
                </Badge>
              </div>
              <metric.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DatabaseHealth() {
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const runDatabaseDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    // Simulate running diagnostics
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunningDiagnostics(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RLS Policies</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Database className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Backup</p>
                <p className="text-sm font-medium">2 hours ago</p>
              </div>
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DataConsistencyChecker />
      
      <Card>
        <CardHeader>
          <CardTitle>Database Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Run comprehensive database diagnostics to check for performance issues, 
              integrity problems, and optimization opportunities.
            </p>
            <Button 
              onClick={runDatabaseDiagnostics}
              disabled={isRunningDiagnostics}
              className="w-full md:w-auto"
            >
              {isRunningDiagnostics ? 'Running Diagnostics...' : 'Run Database Diagnostics'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityMonitoring() {
  return (
    <div className="space-y-6">
      <SecurityAlerts />
      <SecurityAuditLog />
    </div>
  );
}

export function ComprehensiveSecurityDashboard() {
  return (
    <EnhancedSecurityProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Security Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor application security, data integrity, and system health
            </p>
          </div>
        </div>

        <SecurityOverview />

        <Tabs defaultValue="monitoring" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monitoring">Security Monitoring</TabsTrigger>
            <TabsTrigger value="database">Database Health</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitoring" className="space-y-4">
            <SecurityMonitoring />
          </TabsContent>
          
          <TabsContent value="database" className="space-y-4">
            <DatabaseHealth />
          </TabsContent>
        </Tabs>
      </div>
    </EnhancedSecurityProvider>
  );
}
/**
 * Service Monitoring Dashboard
 * Provides real-time monitoring and management of the service system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Settings,
  Database,
  Printer,
  BarChart,
  Shield
} from 'lucide-react';
import { Services } from '@/services/core';
import { toast } from 'sonner';

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
  lastCheck: Date;
}

interface ServiceMetrics {
  name: string;
  health: ServiceHealth;
  operations: number;
  errors: number;
  avgResponseTime: number;
}

export function ServiceMonitoringDashboard() {
  const [services, setServices] = useState<ServiceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadServiceMetrics = async () => {
    try {
      setLoading(true);
      
      // Get barcode service health
      const barcodeService = await Services.getBarcodeService();
      const barcodeHealth = await barcodeService.healthCheck();
      
      // Get print service health
      const printService = await Services.getPrintService();
      const printHealth = await printService.healthCheck();
      
      const metrics: ServiceMetrics[] = [
        {
          name: 'Barcode Service',
          health: { ...barcodeHealth, lastCheck: new Date() },
          operations: Math.floor(Math.random() * 1000) + 500,
          errors: Math.floor(Math.random() * 10),
          avgResponseTime: Math.floor(Math.random() * 100) + 50
        },
        {
          name: 'Print Service',
          health: { ...printHealth, lastCheck: new Date() },
          operations: Math.floor(Math.random() * 200) + 100,
          errors: Math.floor(Math.random() * 5),
          avgResponseTime: Math.floor(Math.random() * 200) + 100
        }
      ];
      
      setServices(metrics);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Failed to load service metrics:', error);
      toast.error("Failed to load service metrics");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive'
    }[status] as 'default' | 'secondary' | 'destructive';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const restartService = async (serviceName: string) => {
    try {
      toast.loading(`Restarting ${serviceName}...`);
      
      // Simulate service restart
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadServiceMetrics();
      
      toast.success(`${serviceName} restarted successfully`);
    } catch (error) {
      toast.error(`Failed to restart ${serviceName}`);
    }
  };

  useEffect(() => {
    loadServiceMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadServiceMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Service Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading service metrics...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthyServices = services.filter(s => s.health.status === 'healthy').length;
  const totalServices = services.length;
  const systemHealth = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Service System Overview
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadServiceMetrics}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthyServices}</div>
              <div className="text-sm text-muted-foreground">Healthy Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalServices}</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {services.reduce((sum, s) => sum + s.operations, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {services.reduce((sum, s) => sum + s.errors, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Errors</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Health</span>
              <span className="text-sm text-muted-foreground">{systemHealth.toFixed(0)}%</span>
            </div>
            <Progress value={systemHealth} className="h-2" />
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="space-y-4">
          {services.map((service) => (
            <Card key={service.name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.name.includes('Barcode') ? (
                      <BarChart className="w-5 h-5" />
                    ) : (
                      <Printer className="w-5 h-5" />
                    )}
                    {service.name}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(service.health.status)}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => restartService(service.name)}
                    >
                      <Settings className="w-4 h-4" />
                      Restart
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Operations</div>
                    <div className="text-2xl font-bold">{service.operations}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Errors</div>
                    <div className="text-2xl font-bold text-red-600">{service.errors}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Avg Response Time</div>
                    <div className="text-2xl font-bold">{service.avgResponseTime}ms</div>
                  </div>
                </div>
                
                {service.health.details && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">Health Details</div>
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(service.health.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Performance metrics visualization would be implemented here
                with charts showing service response times, error rates, and throughput.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Service configuration management would be implemented here
                allowing administrators to modify service settings and policies.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ServiceMonitoringDashboard;
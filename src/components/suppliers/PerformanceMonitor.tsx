import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Zap, 
  Clock, 
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Gauge
} from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface SystemHealth {
  database: 'healthy' | 'slow' | 'critical';
  queries: 'optimized' | 'slow' | 'failing';
  memory: 'normal' | 'high' | 'critical';
  responseTime: number;
}

export function PerformanceMonitor() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    queries: 'optimized',
    memory: 'normal',
    responseTime: 0,
  });
  
  const { measurePerformance } = usePerformanceMonitor();
  
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    {
      name: 'Query Response Time',
      value: 0,
      target: 200,
      unit: 'ms',
      status: 'good',
      trend: 'stable'
    },
    {
      name: 'Transaction Processing',
      value: 0,
      target: 100,
      unit: '/min',
      status: 'good',
      trend: 'up'
    },
    {
      name: 'Cache Hit Rate',
      value: 95,
      target: 90,
      unit: '%',
      status: 'good',
      trend: 'stable'
    },
    {
      name: 'Error Rate',
      value: 0.1,
      target: 1,
      unit: '%',
      status: 'good',
      trend: 'down'
    }
  ]);

  // Simulate performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Measure a dummy operation
      const responseTime = measurePerformance('transaction-query', () => {
        // Simulate query time
        const delay = Math.random() * 300 + 50;
        return new Promise(resolve => setTimeout(resolve, delay));
      });

      // Update metrics with simulated data
      setMetrics(prev => prev.map(metric => {
        let newValue = metric.value;
        let newStatus = metric.status;
        
        switch (metric.name) {
          case 'Query Response Time':
            newValue = Math.random() * 300 + 50;
            newStatus = newValue > 250 ? 'critical' : newValue > 150 ? 'warning' : 'good';
            break;
          case 'Transaction Processing':
            newValue = Math.random() * 120 + 80;
            newStatus = newValue < 60 ? 'critical' : newValue < 80 ? 'warning' : 'good';
            break;
          case 'Cache Hit Rate':
            newValue = 90 + Math.random() * 10;
            newStatus = newValue < 85 ? 'critical' : newValue < 90 ? 'warning' : 'good';
            break;
          case 'Error Rate':
            newValue = Math.random() * 2;
            newStatus = newValue > 2 ? 'critical' : newValue > 1 ? 'warning' : 'good';
            break;
        }
        
        return { ...metric, value: newValue, status: newStatus };
      }));

      // Update system health
      setSystemHealth(prev => ({
        ...prev,
        responseTime: Math.random() * 300 + 50,
        database: Math.random() > 0.9 ? 'slow' : 'healthy',
        queries: Math.random() > 0.95 ? 'slow' : 'optimized',
        memory: Math.random() > 0.8 ? 'high' : 'normal',
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [measurePerformance]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': case 'optimized': case 'normal': return 'text-green-500';
      case 'warning': case 'slow': case 'high': return 'text-yellow-500';
      case 'critical': case 'failing': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': case 'healthy': case 'optimized': case 'normal': 
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': case 'slow': case 'high': 
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': case 'failing': 
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: 
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const overallHealth = metrics.every(m => m.status === 'good') ? 'good' : 
                      metrics.some(m => m.status === 'critical') ? 'critical' : 'warning';

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className={`rounded-full w-12 h-12 p-0 shadow-lg ${
            overallHealth === 'good' ? 'bg-green-500 hover:bg-green-600' :
            overallHealth === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
            'bg-red-500 hover:bg-red-600'
          }`}
        >
          <Gauge className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
              <Badge variant={overallHealth === 'good' ? 'default' : overallHealth === 'warning' ? 'secondary' : 'destructive'}>
                {overallHealth}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Health Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-xs">DB:</span>
              <span className={`text-xs font-medium ${getStatusColor(systemHealth.database)}`}>
                {systemHealth.database}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-xs">Queries:</span>
              <span className={`text-xs font-medium ${getStatusColor(systemHealth.queries)}`}>
                {systemHealth.queries}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Response:</span>
              <span className="text-xs font-medium">
                {systemHealth.responseTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Memory:</span>
              <span className={`text-xs font-medium ${getStatusColor(systemHealth.memory)}`}>
                {systemHealth.memory}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="text-xs font-medium">{metric.name}</span>
                  </div>
                  <span className="text-xs">
                    {metric.value.toFixed(metric.name === 'Cache Hit Rate' || metric.name === 'Error Rate' ? 1 : 0)}{metric.unit}
                  </span>
                </div>
                <Progress 
                  value={Math.min((metric.value / metric.target) * 100, 100)} 
                  className="h-1"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target: {metric.target}{metric.unit}</span>
                  <span className={getStatusColor(metric.status)}>{metric.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-6">
              Optimize
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-6">
              Clear Cache
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-6">
              Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
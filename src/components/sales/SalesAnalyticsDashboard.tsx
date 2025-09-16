import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, TrendingUp, TrendingDown, Euro, ShoppingCart, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Sale } from '@/services/sales/types';
import { SalesDataService } from '@/services/sales/SalesDataService';
import { SalesPermissionGuard } from './SalesPermissionGuard';

interface SalesAnalyticsDashboardProps {
  sales: Sale[];
  isLoading?: boolean;
}

export function SalesAnalyticsDashboard({ sales, isLoading }: SalesAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Filter sales by selected period
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return sales.filter(sale => new Date(sale.created_at) >= startDate);
  }, [sales, selectedPeriod]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalSales = filteredSales.length;
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Payment method breakdown by count
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      const method = sale.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Payment method breakdown by total amounts
    const paymentMethodTotals = filteredSales.reduce((acc, sale) => {
      const method = sale.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + (sale.total_amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Calculate specific payment totals
    const cardPayments = (paymentMethodTotals['card'] || 0) + (paymentMethodTotals['credit_card'] || 0);
    const cashPayments = paymentMethodTotals['cash'] || 0;
    const hybridPayments = paymentMethodTotals['hybrid'] || 0;
    const totalPayments = cardPayments + cashPayments + hybridPayments;

    // Top products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const productName = `${item.product?.brand} ${item.product?.model}`;
        const current = productSales.get(item.product_id) || { name: productName, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.total_price || 0;
        productSales.set(item.product_id, current);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by status
    const statusBreakdown = filteredSales.reduce((acc, sale) => {
      const status = sale.status || 'completed';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time series data (simplified)
    const dailySales = filteredSales.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + sale.total_amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalSales,
      avgSaleValue,
      paymentMethods,
      paymentMethodTotals,
      cardPayments,
      cashPayments,
      hybridPayments,
      totalPayments,
      topProducts,
      statusBreakdown,
      dailySales,
    };
  }, [filteredSales]);

  const exportToCSV = () => {
    const headers = ['Data', 'Numero Garentille', 'Cliente', 'Totale', 'Metodo Pagamento', 'Status'];
    const rows = filteredSales.map(sale => [
      SalesDataService.formatDate(sale.created_at),
      sale.sale_number,
      SalesDataService.getClientDisplayName(sale.client),
      `€${sale.total_amount.toFixed(2)}`,
      SalesDataService.formatPaymentMethod(sale.payment_method),
      sale.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garentille-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <SalesPermissionGuard requiredRole="analytics">
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Analytics Garentille</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Ultima Settimana</SelectItem>
                <SelectItem value="month">Ultimo Mese</SelectItem>
                <SelectItem value="quarter">Ultimo Trimestre</SelectItem>
                <SelectItem value="year">Ultimo Anno</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fatturato Totale</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                +{filteredSales.length} garentille
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Numero Garentille</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                Totale transazioni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valore Medio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.avgSaleValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Per garentille
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienti Unici</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(filteredSales.map(s => s.client_id).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Clienti serviti
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment method breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamenti Carta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.cardPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.cardPayments / analytics.totalRevenue) * 100).toFixed(1)}% del totale • {((analytics.paymentMethods['card'] || 0) + (analytics.paymentMethods['credit_card'] || 0))} transazioni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamenti Contanti</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.cashPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.cashPayments / analytics.totalRevenue) * 100).toFixed(1)}% del totale • {analytics.paymentMethods['cash'] || 0} transazioni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamenti Ibridi</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.hybridPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.hybridPayments / analytics.totalRevenue) * 100).toFixed(1)}% del totale • {analytics.paymentMethods['hybrid'] || 0} transazioni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Globale</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{analytics.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                100% fatturato • {analytics.totalSales} transazioni totali
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed analytics tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="products">Prodotti</TabsTrigger>
            <TabsTrigger value="payments">Pagamenti</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Status Garentille</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metodi di Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.paymentMethods).map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between">
                        <span>{SalesDataService.formatPaymentMethod(method)}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Prodotti per Fatturato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} venduti
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{product.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Metodi di Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.paymentMethods).map(([method, count]) => {
                    const percentage = (count / analytics.totalSales) * 100;
                    return (
                      <div key={method} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{SalesDataService.formatPaymentMethod(method)}</span>
                          <span>{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Andamento Vendite</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(analytics.dailySales).length > 0 
                      ? `Vendite registrate in ${Object.keys(analytics.dailySales).length} giorni diversi`
                      : 'Nessuna vendita nel periodo selezionato'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metriche Periodo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Periodo:</span>
                      <span className="capitalize">{selectedPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Totale Garentille:</span>
                      <span>{analytics.totalSales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fatturato:</span>
                      <span>€{analytics.totalRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SalesPermissionGuard>
  );
}
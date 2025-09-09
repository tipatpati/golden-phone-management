import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Package,
  Clock,
  Star,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { useSuppliers } from "@/services";
import { useSupplierTransactions } from "@/services/suppliers/SupplierTransactionService";

interface InsightCard {
  title: string;
  value: string;
  change: number;
  period: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface PredictiveInsight {
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
}

export function SupplierInsights() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y'>('90d');
  const { data: suppliers } = useSuppliers();
  const { data: transactions } = useSupplierTransactions();

  // Calculate insights
  const insights = React.useMemo(() => {
    if (!suppliers || !transactions) return { cards: [], predictive: [] };

    const cutoffDate = new Date();
    switch (selectedTimeframe) {
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
    }

    const recentTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= cutoffDate && t.status === 'completed'
    );

    const totalSpend = recentTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const avgOrderValue = recentTransactions.length > 0 ? totalSpend / recentTransactions.length : 0;
    const activeSuppliers = new Set(recentTransactions.map(t => t.supplier_id)).size;
    
    // Calculate previous period for comparison
    const previousCutoff = new Date(cutoffDate);
    switch (selectedTimeframe) {
      case '30d':
        previousCutoff.setDate(previousCutoff.getDate() - 30);
        break;
      case '90d':
        previousCutoff.setDate(previousCutoff.getDate() - 90);
        break;
      case '1y':
        previousCutoff.setFullYear(previousCutoff.getFullYear() - 1);
        break;
    }

    const previousTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= previousCutoff && 
      new Date(t.transaction_date) < cutoffDate &&
      t.status === 'completed'
    );

    const previousSpend = previousTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const previousAvgOrder = previousTransactions.length > 0 ? previousSpend / previousTransactions.length : 0;
    const previousActiveSuppliers = new Set(previousTransactions.map(t => t.supplier_id)).size;

    const spendChange = previousSpend > 0 ? ((totalSpend - previousSpend) / previousSpend) * 100 : 0;
    const avgOrderChange = previousAvgOrder > 0 ? ((avgOrderValue - previousAvgOrder) / previousAvgOrder) * 100 : 0;
    const supplierChange = previousActiveSuppliers > 0 ? ((activeSuppliers - previousActiveSuppliers) / previousActiveSuppliers) * 100 : 0;

    const cards: InsightCard[] = [
      {
        title: 'Total Spend',
        value: `€${totalSpend.toLocaleString()}`,
        change: spendChange,
        period: selectedTimeframe,
        icon: <DollarSign className="h-5 w-5" />,
        trend: spendChange > 0 ? 'up' : spendChange < 0 ? 'down' : 'stable',
        status: spendChange > 10 ? 'warning' : 'good'
      },
      {
        title: 'Avg Order Value',
        value: `€${avgOrderValue.toFixed(2)}`,
        change: avgOrderChange,
        period: selectedTimeframe,
        icon: <Package className="h-5 w-5" />,
        trend: avgOrderChange > 0 ? 'up' : avgOrderChange < 0 ? 'down' : 'stable',
        status: avgOrderChange < -10 ? 'warning' : 'good'
      },
      {
        title: 'Active Suppliers',
        value: activeSuppliers.toString(),
        change: supplierChange,
        period: selectedTimeframe,
        icon: <Star className="h-5 w-5" />,
        trend: supplierChange > 0 ? 'up' : supplierChange < 0 ? 'down' : 'stable',
        status: 'good'
      },
      {
        title: 'Transaction Volume',
        value: recentTransactions.length.toString(),
        change: previousTransactions.length > 0 ? ((recentTransactions.length - previousTransactions.length) / previousTransactions.length) * 100 : 0,
        period: selectedTimeframe,
        icon: <BarChart3 className="h-5 w-5" />,
        trend: recentTransactions.length > previousTransactions.length ? 'up' : recentTransactions.length < previousTransactions.length ? 'down' : 'stable',
        status: 'good'
      }
    ];

    // Generate predictive insights
    const predictive: PredictiveInsight[] = [];

    // Identify top suppliers by volume
    const supplierSpend = recentTransactions.reduce((acc, t) => {
      acc[t.supplier_id] = (acc[t.supplier_id] || 0) + t.total_amount;
      return acc;
    }, {} as Record<string, number>);

    const topSupplier = Object.entries(supplierSpend).sort(([,a], [,b]) => b - a)[0];
    if (topSupplier && topSupplier[1] > totalSpend * 0.3) {
      const supplierName = Array.isArray(suppliers) ? suppliers.find(s => s.id === topSupplier[0])?.name || 'Unknown' : 'Unknown';
      predictive.push({
        type: 'risk',
        title: 'Supplier Concentration Risk',
        description: `${supplierName} accounts for ${((topSupplier[1] / totalSpend) * 100).toFixed(1)}% of total spend`,
        confidence: 85,
        impact: 'high',
        actionItems: [
          'Diversify supplier base',
          'Negotiate better terms',
          'Identify backup suppliers'
        ]
      });
    }

    // Identify seasonal patterns
    const monthlySpend = recentTransactions.reduce((acc, t) => {
      const month = new Date(t.transaction_date).getMonth();
      acc[month] = (acc[month] || 0) + t.total_amount;
      return acc;
    }, {} as Record<number, number>);

    const avgMonthlySpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0) / Object.keys(monthlySpend).length;
    const highSpendMonths = Object.entries(monthlySpend).filter(([, spend]) => spend > avgMonthlySpend * 1.5);

    if (highSpendMonths.length > 0) {
      predictive.push({
        type: 'trend',
        title: 'Seasonal Spending Pattern',
        description: `Higher spending detected in certain months, potential for budget optimization`,
        confidence: 72,
        impact: 'medium',
        actionItems: [
          'Plan inventory based on seasonal patterns',
          'Negotiate bulk discounts for high-spend periods',
          'Smooth out purchasing cycles'
        ]
      });
    }

    // Identify cost-saving opportunities
    const frequentSuppliers = Object.entries(
      recentTransactions.reduce((acc, t) => {
        acc[t.supplier_id] = (acc[t.supplier_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).filter(([, count]) => count >= 5);

    if (frequentSuppliers.length > 0) {
      predictive.push({
        type: 'opportunity',
        title: 'Volume Discount Opportunity',
        description: `${frequentSuppliers.length} suppliers with frequent orders could offer volume discounts`,
        confidence: 90,
        impact: 'medium',
        actionItems: [
          'Negotiate volume-based pricing',
          'Consolidate orders where possible',
          'Review payment terms for better rates'
        ]
      });
    }

    return { cards, predictive };
  }, [suppliers, transactions, selectedTimeframe]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="h-5 w-5 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Supplier Insights & Analytics
          </CardTitle>
          <div className="flex gap-2">
            {[
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '1y', label: '1Y' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={selectedTimeframe === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(option.value as any)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.cards.map((card) => (
                <Card key={card.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {card.icon}
                        <span className="text-sm font-medium text-muted-foreground">
                          {card.title}
                        </span>
                      </div>
                      {getTrendIcon(card.trend)}
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold">{card.value}</div>
                      <div className={`text-sm ${getStatusColor(card.status)} flex items-center gap-1`}>
                        {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                        <span className="text-muted-foreground">vs {card.period}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {/* Predictive Insights */}
            <div className="space-y-4">
              {insights.predictive.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No insights available for the selected timeframe
                </div>
              ) : (
                insights.predictive.map((insight, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{insight.title}</h3>
                            <Badge variant={insight.type === 'opportunity' ? 'default' : insight.type === 'risk' ? 'destructive' : 'secondary'}>
                              {insight.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.confidence}% confidence
                            </Badge>
                            <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'secondary' : 'outline'}>
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Recommended Actions:</span>
                            <ul className="text-sm space-y-1">
                              {insight.actionItems.map((action, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <div className="h-1 w-1 bg-current rounded-full" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
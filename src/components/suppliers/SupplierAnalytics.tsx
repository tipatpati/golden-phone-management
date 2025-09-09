import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { useSuppliers } from "@/services";
import { useSupplierTransactions } from "@/services/suppliers/SupplierTransactionService";

interface SupplierAnalyticsData {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_amount: number;
  average_order_value: number;
  last_transaction_date?: string;
  transaction_count: number;
  status: 'active' | 'inactive';
  contact_info?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export function SupplierAnalytics() {
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  const { data: transactions, isLoading: loadingTransactions } = useSupplierTransactions();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y' | 'all'>('90d');

  // Calculate supplier analytics
  const supplierAnalytics: SupplierAnalyticsData[] = React.useMemo(() => {
    if (!suppliers || !transactions) return [];

    const cutoffDate = selectedTimeframe === 'all' ? null : new Date();
    if (cutoffDate) {
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
    }

    const analytics = Array.isArray(suppliers) ? suppliers.map((supplier) => {
      const supplierTransactions = transactions.filter(t => {
        const isSupplierMatch = t.supplier_id === supplier.id;
        const isWithinTimeframe = !cutoffDate || new Date(t.transaction_date) >= cutoffDate;
        const isPurchase = t.type === 'purchase' && t.status === 'completed';
        return isSupplierMatch && isWithinTimeframe && isPurchase;
      });

      const total_amount = supplierTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const transaction_count = supplierTransactions.length;
      const average_order_value = transaction_count > 0 ? total_amount / transaction_count : 0;
      
      const lastTransaction = supplierTransactions
        .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        total_purchases: transaction_count,
        total_amount,
        average_order_value,
        last_transaction_date: lastTransaction?.transaction_date,
        transaction_count,
        status: supplier.status,
        contact_info: {
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
        },
      } as SupplierAnalyticsData;
    }) : [];

    // Sort by total amount descending
    return analytics.sort((a, b) => b.total_amount - a.total_amount);
  }, [suppliers, transactions, selectedTimeframe]);

  const getPerformanceRating = (analytics: SupplierAnalyticsData): { rating: number; label: string; color: string } => {
    if (analytics.transaction_count === 0) {
      return { rating: 0, label: 'No Activity', color: 'bg-gray-500' };
    }
    
    if (analytics.total_amount > 10000 && analytics.transaction_count > 10) {
      return { rating: 5, label: 'Excellent', color: 'bg-green-500' };
    } else if (analytics.total_amount > 5000 && analytics.transaction_count > 5) {
      return { rating: 4, label: 'Good', color: 'bg-blue-500' };
    } else if (analytics.total_amount > 1000 && analytics.transaction_count > 2) {
      return { rating: 3, label: 'Average', color: 'bg-yellow-500' };
    } else if (analytics.transaction_count > 0) {
      return { rating: 2, label: 'Poor', color: 'bg-orange-500' };
    }
    
    return { rating: 1, label: 'Very Poor', color: 'bg-red-500' };
  };

  if (loadingSuppliers || loadingTransactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Supplier Performance Analytics</CardTitle>
          <div className="flex space-x-2">
            {[
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: '1y', label: '1 Year' },
              { value: 'all', label: 'All Time' },
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
        <div className="space-y-4">
          {supplierAnalytics.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No supplier data available</p>
            </div>
          ) : (
            supplierAnalytics.map((analytics) => {
              const performance = getPerformanceRating(analytics);
              
              return (
                <div key={analytics.supplier_id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Supplier Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{analytics.supplier_name}</h3>
                      <Badge variant={analytics.status === 'active' ? 'default' : 'secondary'}>
                        {analytics.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {analytics.contact_info?.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{analytics.contact_info.email}</span>
                        </div>
                      )}
                      {analytics.contact_info?.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{analytics.contact_info.phone}</span>
                        </div>
                      )}
                      {analytics.last_transaction_date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last: {new Date(analytics.last_transaction_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="text-right space-y-1">
                    <div className="text-lg font-semibold">
                      €{analytics.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.transaction_count} transaction{analytics.transaction_count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg: €{analytics.average_order_value.toFixed(2)}
                    </div>
                  </div>

                  {/* Performance Rating */}
                  <div className="flex flex-col items-center space-y-1">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < performance.rating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="outline" className={`text-xs ${performance.color} text-white border-0`}>
                      {performance.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
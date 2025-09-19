import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, DollarSign, User, CreditCard, Package, Filter } from 'lucide-react';
import { SoldProductsTrackingService, type SoldProductUnit, type ProductSalesMetrics } from '@/services/sold-products/SoldProductsTrackingService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SoldProductsHistoryTabProps {
  productId: string;
  productBrand: string;
  productModel: string;
}

export function SoldProductsHistoryTab({ productId, productBrand, productModel }: SoldProductsHistoryTabProps) {
  const [soldUnits, setSoldUnits] = useState<SoldProductUnit[]>([]);
  const [metrics, setMetrics] = useState<ProductSalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: '',
    salesperson_name: '',
    payment_method: '',
    date_from: '',
    date_to: '',
    supplier_name: ''
  });

  useEffect(() => {
    loadSoldProductsData();
  }, [productId, filters]);

  const loadSoldProductsData = async () => {
    try {
      setLoading(true);
      const [unitsData, metricsData] = await Promise.all([
        SoldProductsTrackingService.getSoldUnitsForProduct(productId, filters),
        SoldProductsTrackingService.getProductSalesMetrics(productId)
      ]);
      
      setSoldUnits(unitsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading sold products data:', error);
      toast.error('Failed to load sold products data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      customer_name: '',
      salesperson_name: '',
      payment_method: '',
      date_from: '',
      date_to: '',
      supplier_name: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateProfit = (soldPrice: number, originalPrice?: number) => {
    if (!originalPrice) return null;
    return soldPrice - originalPrice;
  };

  const calculateProfitMargin = (soldPrice: number, originalPrice?: number) => {
    if (!originalPrice || soldPrice <= 0) return null;
    return ((soldPrice - originalPrice) / soldPrice) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sold products data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_units_sold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.total_profit)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.average_profit_margin.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                Complete sales history for {productBrand} {productModel}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Customer name..."
                value={filters.customer_name}
                onChange={(e) => handleFilterChange('customer_name', e.target.value)}
              />
              <Input
                placeholder="Salesperson..."
                value={filters.salesperson_name}
                onChange={(e) => handleFilterChange('salesperson_name', e.target.value)}
              />
              <Select
                value={filters.payment_method}
                onValueChange={(value) => handleFilterChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
              <Input
                type="date"
                placeholder="To date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
              <Input
                placeholder="Supplier..."
                value={filters.supplier_name}
                onChange={(e) => handleFilterChange('supplier_name', e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        )}

        <CardContent>
          {soldUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales records found for this product.
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {soldUnits.map((unit) => {
                  const profit = calculateProfit(unit.sold_price, unit.original_purchase_price);
                  const profitMargin = calculateProfitMargin(unit.sold_price, unit.original_purchase_price);
                  
                  return (
                    <Card key={unit.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-lg">
                              Sale #{unit.sale_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Serial: {unit.serial_number}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatCurrency(unit.sold_price)}
                            </div>
                            {profit !== null && (
                              <div className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Profit: {formatCurrency(profit)}
                                {profitMargin !== null && ` (${profitMargin.toFixed(1)}%)`}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(unit.sold_at), 'MMM dd, yyyy')}
                          </div>
                          {unit.customer_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {unit.customer_name}
                            </div>
                          )}
                          {unit.payment_method && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              <Badge variant="outline">{unit.payment_method}</Badge>
                            </div>
                          )}
                          {unit.supplier_name && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {unit.supplier_name}
                            </div>
                          )}
                        </div>

                        {unit.salesperson_name && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Sold by: {unit.salesperson_name}
                          </div>
                        )}

                        {unit.original_purchase_price && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Original cost: {formatCurrency(unit.original_purchase_price)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
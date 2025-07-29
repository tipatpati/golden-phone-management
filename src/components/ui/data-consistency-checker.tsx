import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataIssue {
  id: string;
  type: 'category_mismatch' | 'missing_serial_numbers' | 'invalid_price_range' | 'orphaned_records';
  table: string;
  description: string;
  recordId: string;
  severity: 'low' | 'medium' | 'high';
}

export function DataConsistencyChecker() {
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkDataConsistency = async () => {
    setIsChecking(true);
    const foundIssues: DataIssue[] = [];

    try {
      // Check for category mismatches
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category_id, category:categories(name)')
        .not('category', 'is', null);

      products?.forEach(product => {
        const productName = product.name.toLowerCase();
        const categoryName = (product.category as any)?.name?.toLowerCase();
        
        if (productName.includes('dell') || productName.includes('laptop') || productName.includes('xps')) {
          if (categoryName !== 'computers') {
            foundIssues.push({
              id: `category_${product.id}`,
              type: 'category_mismatch',
              table: 'products',
              description: `Product "${product.name}" appears to be a computer but is categorized as "${categoryName}"`,
              recordId: product.id,
              severity: 'medium'
            });
          }
        }
      });

      // Check for missing serial numbers
      const { data: serialProducts } = await supabase
        .from('products')
        .select('id, name, has_serial, serial_numbers')
        .eq('has_serial', true);

      serialProducts?.forEach(product => {
        if (!product.serial_numbers || product.serial_numbers.length === 0) {
          foundIssues.push({
            id: `serial_${product.id}`,
            type: 'missing_serial_numbers',
            table: 'products',
            description: `Product "${product.name}" is marked as having serial numbers but none are recorded`,
            recordId: product.id,
            severity: 'low'
          });
        }
      });

      // Check for invalid price ranges
      const { data: priceProducts } = await supabase
        .from('products')
        .select('id, name, price, min_price, max_price');

      priceProducts?.forEach(product => {
        if (product.min_price && product.max_price && product.min_price > product.max_price) {
          foundIssues.push({
            id: `price_${product.id}`,
            type: 'invalid_price_range',
            table: 'products',
            description: `Product "${product.name}" has min_price (${product.min_price}) greater than max_price (${product.max_price})`,
            recordId: product.id,
            severity: 'high'
          });
        }
        
        if (product.price < (product.min_price || 0) || product.price > (product.max_price || Infinity)) {
          foundIssues.push({
            id: `price_range_${product.id}`,
            type: 'invalid_price_range',
            table: 'products',
            description: `Product "${product.name}" current price (${product.price}) is outside the defined range`,
            recordId: product.id,
            severity: 'medium'
          });
        }
      });

      // Check for orphaned sale items
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('id, sale_id, product_id, sales!inner(id), products!inner(id)');

      const { data: orphanedSaleItems } = await supabase
        .from('sale_items')
        .select('id, sale_id, product_id')
        .not('sale_id', 'in', `(${saleItems?.map(item => `'${item.sale_id}'`).join(',') || "''"})`)
        .limit(10);

      orphanedSaleItems?.forEach(item => {
        foundIssues.push({
          id: `orphaned_sale_${item.id}`,
          type: 'orphaned_records',
          table: 'sale_items',
          description: `Sale item references non-existent sale ID: ${item.sale_id}`,
          recordId: item.id,
          severity: 'high'
        });
      });

      setIssues(foundIssues);
      setLastCheck(new Date());
      
      if (foundIssues.length === 0) {
        toast.success('Data consistency check completed - no issues found!');
      } else {
        toast.warning(`Found ${foundIssues.length} data consistency issues`);
      }
    } catch (error) {
      console.error('Data consistency check failed:', error);
      toast.error('Failed to run data consistency check');
    } finally {
      setIsChecking(false);
    }
  };

  const fixIssue = async (issue: DataIssue) => {
    try {
      switch (issue.type) {
        case 'category_mismatch':
          // Auto-fix category based on product name
          const productName = issue.description.split('"')[1]?.toLowerCase();
          let correctCategoryId = 1; // default
          
          if (productName?.includes('dell') || productName?.includes('laptop') || productName?.includes('xps')) {
            correctCategoryId = 9; // Computers category
          }
          
          await supabase
            .from('products')
            .update({ category_id: correctCategoryId })
            .eq('id', issue.recordId);
          break;
          
        case 'missing_serial_numbers':
          // Set has_serial to false if no serial numbers
          await supabase
            .from('products')
            .update({ has_serial: false })
            .eq('id', issue.recordId);
          break;
          
        case 'orphaned_records':
          // Delete orphaned records
          if (issue.table === 'sale_items') {
            await supabase
              .from('sale_items')
              .delete()
              .eq('id', issue.recordId);
          }
          break;
      }
      
      // Remove fixed issue from list
      setIssues(prev => prev.filter(i => i.id !== issue.id));
      toast.success('Issue fixed successfully');
    } catch (error) {
      console.error('Failed to fix issue:', error);
      toast.error('Failed to fix issue');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Data Consistency
          </CardTitle>
          <Button 
            onClick={checkDataConsistency}
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isChecking ? 'Checking...' : 'Run Check'}
          </Button>
        </div>
        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {lastCheck ? 'No data consistency issues found' : 'Run a check to verify data consistency'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <Badge variant={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {issue.table}
                    </span>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fixIssue(issue)}
                  className="ml-3"
                >
                  Fix
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  User,
  Package,
  DollarSign
} from "lucide-react";
import { InventoryManagementService } from "@/services/inventory/InventoryManagementService";
import type { Tables } from "@/integrations/supabase/types";

type ProductHistoryRow = Tables<'product_history'>;
type ProductUnitHistoryRow = Tables<'product_unit_history'>;

interface ProductHistoryViewProps {
  productId: string;
  productUnits?: Array<{ id: string; serial_number: string }>;
}

export function ProductHistoryView({ productId, productUnits = [] }: ProductHistoryViewProps) {
  const [productHistory, setProductHistory] = useState<ProductHistoryRow[]>([]);
  const [unitHistory, setUnitHistory] = useState<ProductUnitHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch product history
        const prodHistory = await InventoryManagementService.getProductHistory(productId);
        setProductHistory(prodHistory);

        // Fetch unit history for all units
        if (productUnits.length > 0) {
          const unitHistoryPromises = productUnits.map(unit => 
            InventoryManagementService.getProductUnitHistory(unit.id)
          );
          const allUnitHistory = await Promise.all(unitHistoryPromises);
          setUnitHistory(allUnitHistory.flat());
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [productId, productUnits]);

  const getOperationIcon = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'insert':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'insert':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatChangeData = (oldData: any, newData: any, operation: string) => {
    if (operation === 'insert') {
      return [
        { label: 'Created', value: 'New record created' }
      ];
    }
    
    if (operation === 'delete') {
      return [
        { label: 'Deleted', value: 'Record removed' }
      ];
    }

    // For updates, show changed fields
    const changes: Array<{ label: string; value: string }> = [];
    
    if (!oldData || !newData) return changes;

    const keys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
    
    keys.forEach(key => {
      if (oldData[key] !== newData[key] && key !== 'updated_at') {
        const oldValue = oldData[key] ?? 'null';
        const newValue = newData[key] ?? 'null';
        changes.push({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          value: `${oldValue} → ${newValue}`
        });
      }
    });

    return changes;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const findUnitName = (unitId: string) => {
    const unit = productUnits.find(u => u.id === unitId);
    return unit?.serial_number || unitId.slice(0, 8);
  };

  // Combine and sort all history entries
  const allHistory = [
    ...productHistory.map(h => ({ ...h, type: 'product' as const })),
    ...unitHistory.map(h => ({ ...h, type: 'unit' as const }))
  ].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Change History
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Track all changes made to this product and its units
        </div>
      </CardHeader>
      <CardContent>
        {allHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No history records found
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {allHistory.map((entry, index) => {
                const changes = formatChangeData(
                  entry.old_data, 
                  entry.new_data, 
                  entry.operation_type
                );

                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getOperationIcon(entry.operation_type)}
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {entry.type === 'product' ? (
                              <Package className="h-4 w-4" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            {entry.type === 'product' ? 'Product' : `Unit ${findUnitName(entry.product_unit_id!)}`}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {formatDate(entry.changed_at)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getOperationColor(entry.operation_type)}>
                        {entry.operation_type.toUpperCase()}
                      </Badge>
                    </div>

                    {entry.note && (
                      <div className="text-sm bg-muted/50 p-2 rounded">
                        <strong>Note:</strong> {entry.note}
                      </div>
                    )}

                    {changes.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <div className="text-sm font-medium">Changes:</div>
                        <div className="space-y-1">
                          {changes.map((change, changeIndex) => (
                            <div key={changeIndex} className="flex items-start gap-2 text-sm">
                              <span className="text-muted-foreground min-w-0 flex-shrink-0">
                                {change.label}:
                              </span>
                              <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded min-w-0">
                                {change.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {entry.changed_by && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Changed by: {entry.changed_by}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
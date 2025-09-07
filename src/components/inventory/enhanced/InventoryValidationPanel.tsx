import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Package, 
  DollarSign, 
  Hash,
  Tag,
  TrendingUp
} from 'lucide-react';
import type { CreateProductData, ProductFormData } from '@/services/inventory/types';

interface ValidationRule {
  id: string;
  name: string;
  status: 'valid' | 'warning' | 'error' | 'pending';
  message: string;
  icon: React.ElementType;
  severity: 'low' | 'medium' | 'high';
}

interface InventoryValidationPanelProps {
  productData: Partial<CreateProductData | ProductFormData>;
  realTimeValidation?: boolean;
  className?: string;
}

export const InventoryValidationPanel: React.FC<InventoryValidationPanelProps> = ({
  productData,
  realTimeValidation = true,
  className
}) => {
  const validationRules = useMemo((): ValidationRule[] => {
    const rules: ValidationRule[] = [];

    // Brand validation
    if (productData.brand?.trim()) {
      rules.push({
        id: 'brand',
        name: 'Marca',
        status: 'valid',
        message: `Marca: ${productData.brand}`,
        icon: Tag,
        severity: 'low'
      });
    } else {
      rules.push({
        id: 'brand',
        name: 'Marca',
        status: 'error',
        message: 'Marca è obbligatoria',
        icon: Tag,
        severity: 'high'
      });
    }

    // Model validation
    if (productData.model?.trim()) {
      rules.push({
        id: 'model',
        name: 'Modello',
        status: 'valid',
        message: `Modello: ${productData.model}`,
        icon: Package,
        severity: 'low'
      });
    } else {
      rules.push({
        id: 'model',
        name: 'Modello',
        status: 'error',
        message: 'Modello è obbligatorio',
        icon: Package,
        severity: 'high'
      });
    }

    // Price validation
    const price = Number(productData.price);
    if (price > 0) {
      const minPrice = Number(productData.min_price) || 0;
      const maxPrice = Number(productData.max_price) || 0;
      
      if (minPrice > 0 && maxPrice > 0 && minPrice >= maxPrice) {
        rules.push({
          id: 'price',
          name: 'Prezzi',
          status: 'error',
          message: 'Il prezzo minimo deve essere inferiore al massimo',
          icon: DollarSign,
          severity: 'high'
        });
      } else if (price < minPrice) {
        rules.push({
          id: 'price',
          name: 'Prezzi',
          status: 'warning',
          message: 'Prezzo base inferiore al minimo',
          icon: DollarSign,
          severity: 'medium'
        });
      } else if (maxPrice > 0 && price > maxPrice) {
        rules.push({
          id: 'price',
          name: 'Prezzi',
          status: 'warning',
          message: 'Prezzo base superiore al massimo',
          icon: DollarSign,
          severity: 'medium'
        });
      } else {
        rules.push({
          id: 'price',
          name: 'Prezzi',
          status: 'valid',
          message: `Prezzo: €${price.toFixed(2)}`,
          icon: DollarSign,
          severity: 'low'
        });
      }
    } else {
      rules.push({
        id: 'price',
        name: 'Prezzi',
        status: 'error',
        message: 'Prezzo base è obbligatorio',
        icon: DollarSign,
        severity: 'high'
      });
    }

    // Stock validation
    const stock = Number(productData.stock) || 0;
    const threshold = Number(productData.threshold) || 0;
    
    if (stock >= 0) {
      if (threshold > 0 && stock <= threshold) {
        rules.push({
          id: 'stock',
          name: 'Stock',
          status: 'warning',
          message: `Stock sotto soglia: ${stock} (soglia: ${threshold})`,
          icon: Hash,
          severity: 'medium'
        });
      } else {
        rules.push({
          id: 'stock',
          name: 'Stock',
          status: 'valid',
          message: `Stock: ${stock} unità`,
          icon: Hash,
          severity: 'low'
        });
      }
    } else {
      rules.push({
        id: 'stock',
        name: 'Stock',
        status: 'error',
        message: 'Stock non può essere negativo',
        icon: Hash,
        severity: 'high'
      });
    }

    // Serial numbers validation (if has_serial is true)
    if (productData.has_serial) {
      const serialNumbers = Array.isArray(productData.serial_numbers) 
        ? productData.serial_numbers 
        : [];
        
      if (serialNumbers.length === 0) {
        rules.push({
          id: 'serials',
          name: 'Numeri Seriali',
          status: 'warning',
          message: 'Nessun numero seriale inserito',
          icon: Hash,
          severity: 'medium'
        });
      } else {
        const duplicates = serialNumbers.filter((serial, index) => 
          serialNumbers.indexOf(serial) !== index
        );
        
        if (duplicates.length > 0) {
          rules.push({
            id: 'serials',
            name: 'Numeri Seriali',
            status: 'error',
            message: `Seriali duplicati: ${duplicates.join(', ')}`,
            icon: Hash,
            severity: 'high'
          });
        } else {
          rules.push({
            id: 'serials',
            name: 'Numeri Seriali',
            status: 'valid',
            message: `${serialNumbers.length} seriali validi`,
            icon: Hash,
            severity: 'low'
          });
        }
      }
    }

    return rules;
  }, [productData]);

  const validCount = validationRules.filter(rule => rule.status === 'valid').length;
  const warningCount = validationRules.filter(rule => rule.status === 'warning').length;
  const errorCount = validationRules.filter(rule => rule.status === 'error').length;
  const totalCount = validationRules.length;
  
  const completionPercentage = (validCount / totalCount) * 100;
  const canProceed = errorCount === 0 && validCount > 0;

  const getStatusIcon = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const getStatusColor = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = (status: ValidationRule['status']) => {
    switch (status) {
      case 'valid':
        return 'default' as const;
      case 'warning':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Validazione Prodotto
          </div>
          <Badge 
            variant={canProceed ? 'default' : 'destructive'}
            className="text-xs"
          >
            {canProceed ? 'Valido' : 'Incompleto'}
          </Badge>
        </CardTitle>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completamento</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
        
        {/* Summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            {validCount} Valido
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} Avviso
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-3 w-3" />
              {errorCount} Errore
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {validationRules.map((rule) => {
          const StatusIcon = getStatusIcon(rule.status);
          const RuleIcon = rule.icon;
          
          return (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <RuleIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium text-sm">{rule.name}</span>
                  <p className="text-xs text-muted-foreground">{rule.message}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariant(rule.status)} className="text-xs">
                  {rule.status}
                </Badge>
                <StatusIcon className={`h-4 w-4 ${getStatusColor(rule.status)}`} />
              </div>
            </div>
          );
        })}
        
        {/* Overall status alert */}
        {!canProceed && realTimeValidation && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Risolvi tutti gli errori prima di salvare il prodotto.
            </AlertDescription>
          </Alert>
        )}
        
        {canProceed && warningCount > 0 && realTimeValidation && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Il prodotto può essere salvato, ma ci sono alcuni avvisi da considerare.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
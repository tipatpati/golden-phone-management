import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Euro,
  Package, 
  User, 
  CreditCard,
  TrendingUp
} from 'lucide-react';
import type { CreateSaleData } from '@/services/sales/types';

interface ValidationRule {
  id: string;
  name: string;
  status: 'valid' | 'warning' | 'error' | 'pending';
  message: string;
  icon: React.ElementType;
  severity: 'low' | 'medium' | 'high';
}

interface EnhancedSalesValidationProps {
  saleData: Partial<CreateSaleData>;
  realTimeValidation?: boolean;
  className?: string;
}

export const EnhancedSalesValidation: React.FC<EnhancedSalesValidationProps> = ({
  saleData,
  realTimeValidation = true,
  className
}) => {
  const validationRules = useMemo((): ValidationRule[] => {
    const rules: ValidationRule[] = [];

    // Client validation
    if (saleData.client_id) {
      rules.push({
        id: 'client',
        name: 'Cliente',
        status: 'valid',
        message: 'Cliente selezionato',
        icon: User,
        severity: 'low'
      });
    } else {
      rules.push({
        id: 'client',
        name: 'Cliente',
        status: 'warning',
        message: 'Nessun cliente selezionato (vendita anonima)',
        icon: User,
        severity: 'low'
      });
    }

    // Sale items validation
    const items = saleData.sale_items || [];
    if (items.length === 0) {
      rules.push({
        id: 'items',
        name: 'Prodotti',
        status: 'error',
        message: 'Nessun prodotto aggiunto alla vendita',
        icon: Package,
        severity: 'high'
      });
    } else {
      const hasInvalidItems = items.some(item => 
        item.quantity <= 0 || item.unit_price <= 0
      );
      
      if (hasInvalidItems) {
        rules.push({
          id: 'items',
          name: 'Prodotti',
          status: 'error',
          message: 'Alcuni prodotti hanno quantità o prezzo non validi',
          icon: Package,
          severity: 'high'
        });
      } else {
        const duplicateSerials = items.filter(item => item.serial_number)
          .map(item => item.serial_number)
          .filter((serial, index, arr) => arr.indexOf(serial) !== index);
          
        if (duplicateSerials.length > 0) {
          rules.push({
            id: 'items',
            name: 'Prodotti',
            status: 'error',
            message: `Numeri seriali duplicati: ${duplicateSerials.join(', ')}`,
            icon: Package,
            severity: 'high'
          });
        } else {
          rules.push({
            id: 'items',
            name: 'Prodotti',
            status: 'valid',
            message: `${items.length} prodotto/i valido/i`,
            icon: Package,
            severity: 'low'
          });
        }
      }
    }

    // Payment method validation
    if (!saleData.payment_method) {
      rules.push({
        id: 'payment',
        name: 'Pagamento',
        status: 'error',
        message: 'Metodo di pagamento richiesto',
        icon: CreditCard,
        severity: 'high'
      });
    } else {
      rules.push({
        id: 'payment',
        name: 'Pagamento',
        status: 'valid',
        message: `Metodo: ${saleData.payment_method}`,
        icon: CreditCard,
        severity: 'low'
      });
    }

    // Price validation
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    if (subtotal > 0) {
      const totalAmount = subtotal * 1.22; // Adding 22% VAT
      
      if (totalAmount > 1000) {
        rules.push({
          id: 'amount',
          name: 'Importo',
          status: 'warning',
          message: `Vendita di alto valore: €${totalAmount.toFixed(2)}`,
          icon: Euro,
          severity: 'medium'
        });
      } else {
        rules.push({
          id: 'amount',
          name: 'Importo',
          status: 'valid',
          message: `Totale: €${totalAmount.toFixed(2)}`,
          icon: Euro,
          severity: 'low'
        });
      }
    }

    return rules;
  }, [saleData]);

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
            Validazione Vendita
          </div>
          <Badge 
            variant={canProceed ? 'default' : 'destructive'}
            className="text-xs"
          >
            {canProceed ? 'Pronta' : 'Incompleta'}
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
              Risolvi tutti gli errori prima di procedere con la vendita.
            </AlertDescription>
          </Alert>
        )}
        
        {canProceed && warningCount > 0 && realTimeValidation && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              La vendita può procedere, ma ci sono alcuni avvisi da considerare.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
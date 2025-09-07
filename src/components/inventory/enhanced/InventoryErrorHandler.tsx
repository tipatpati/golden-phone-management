import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Package, 
  Database,
  Shield,
  Bug
} from 'lucide-react';
import { toast } from 'sonner';
import { InventoryError, isInventoryError, ERROR_CODES } from '@/services/inventory/errors';

interface InventoryErrorHandlerProps {
  error: Error | InventoryError | null;
  context?: string;
  onRetry?: () => void;
  onReset?: () => void;
  showActions?: boolean;
  className?: string;
}

const getErrorMetadata = (error: Error | InventoryError) => {
  if (isInventoryError(error)) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return {
          icon: AlertTriangle,
          color: 'amber',
          severity: 'warning',
          title: 'Errore di Validazione',
          category: 'Validazione'
        };
      case ERROR_CODES.BUSINESS_RULE_ERROR:
        return {
          icon: Shield,
          color: 'blue',
          severity: 'warning',
          title: 'Regola di Business Violata',
          category: 'Business Logic'
        };
      case ERROR_CODES.INSUFFICIENT_STOCK:
        return {
          icon: Package,
          color: 'orange',
          severity: 'warning',
          title: 'Stock Insufficiente',
          category: 'Inventario'
        };
      case ERROR_CODES.DATABASE_ERROR:
        return {
          icon: Database,
          color: 'red',
          severity: 'error',
          title: 'Errore Database',
          category: 'Sistema'
        };
      case ERROR_CODES.DUPLICATE_SERIAL:
        return {
          icon: XCircle,
          color: 'red',
          severity: 'error',
          title: 'Numero Seriale Duplicato',
          category: 'Validazione'
        };
      default:
        return {
          icon: Bug,
          color: 'gray',
          severity: 'error',
          title: 'Errore Inventario',
          category: 'Sistema'
        };
    }
  }
  
  return {
    icon: XCircle,
    color: 'red',
    severity: 'error',
    title: 'Errore Sistema',
    category: 'Sistema'
  };
};

const getColorClasses = (color: string) => {
  switch (color) {
    case 'amber':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'blue':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'orange':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'red':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getSuggestions = (error: Error | InventoryError): string[] => {
  if (isInventoryError(error)) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return [
          'Verifica che tutti i campi obbligatori siano compilati',
          'Controlla il formato dei dati inseriti',
          'Assicurati che i valori numerici siano validi'
        ];
      case ERROR_CODES.INSUFFICIENT_STOCK:
        return [
          'Verifica la disponibilità del prodotto',
          'Riduci la quantità richiesta',
          'Aggiorna l\'inventario se necessario'
        ];
      case ERROR_CODES.DUPLICATE_SERIAL:
        return [
          'Utilizza un numero seriale univoco',
          'Controlla se il seriale è già presente',
          'Verifica l\'archivio dei prodotti venduti'
        ];
      case ERROR_CODES.BUSINESS_RULE_ERROR:
        return [
          'Rispetta i limiti di prezzo definiti',
          'Controlla le politiche aziendali',
          'Verifica i permessi dell\'utente'
        ];
      case ERROR_CODES.DATABASE_ERROR:
        return [
          'Riprova più tardi',
          'Verifica la connessione alla rete',
          'Contatta l\'assistenza tecnica'
        ];
      default:
        return ['Riprova l\'operazione', 'Controlla i dati inseriti'];
    }
  }
  
  return [
    'Ricarica la pagina',
    'Controlla la connessione internet',
    'Contatta l\'assistenza se il problema persiste'
  ];
};

export const InventoryErrorHandler: React.FC<InventoryErrorHandlerProps> = ({
  error,
  context,
  onRetry,
  onReset,
  showActions = true,
  className
}) => {
  if (!error) return null;

  const metadata = getErrorMetadata(error);
  const suggestions = getSuggestions(error);
  const colorClasses = getColorClasses(metadata.color);

  const handleCopyError = () => {
    const errorDetails = {
      message: error.message,
      context,
      ...(isInventoryError(error) && { 
        code: error.code,
        context: error.context 
      })
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => toast.success('Dettagli errore copiati negli appunti'))
      .catch(() => toast.error('Impossibile copiare i dettagli'));
  };

  return (
    <Card className={`border-l-4 ${className}`} style={{ borderLeftColor: `var(--${metadata.color}-500)` }}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${colorClasses}`}>
              <metadata.icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{metadata.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {metadata.category}
                </Badge>
                {context && (
                  <Badge variant="secondary" className="text-xs">
                    {context}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Message */}
        <Alert className={colorClasses}>
          <AlertDescription className="font-medium">
            {error.message}
          </AlertDescription>
        </Alert>

        {/* Error Context (for InventoryError) */}
        {isInventoryError(error) && error.context && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Dettagli tecnici
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </details>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Azioni consigliate:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Riprova
              </Button>
            )}
            
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
              >
                Reset
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyError}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Copia Dettagli
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
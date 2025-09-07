import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { InventoryError, isInventoryError, ERROR_CODES } from '@/services/inventory/errors';

interface ValidationErrorDisplayProps {
  error: Error | InventoryError | null;
  context?: string;
  className?: string;
  showDetails?: boolean;
}

type ErrorSeverity = 'info' | 'warning' | 'error';

const getErrorIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'info':
      return Info;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    default:
      return AlertCircle;
  }
};

const getErrorSeverity = (error: Error | InventoryError): ErrorSeverity => {
  if (isInventoryError(error)) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return 'warning';
      case ERROR_CODES.BUSINESS_RULE_ERROR:
        return 'warning';
      case ERROR_CODES.INSUFFICIENT_STOCK:
        return 'warning';
      case ERROR_CODES.DUPLICATE_SERIAL:
        return 'error';
      case ERROR_CODES.DATABASE_ERROR:
        return 'error';
      case ERROR_CODES.PERMISSION_DENIED:
        return 'error';
      default:
        return 'error';
    }
  }
  return 'error';
};

const getErrorVariant = (severity: ErrorSeverity): 'default' | 'destructive' => {
  return severity === 'error' ? 'destructive' : 'default';
};

const getErrorTitle = (error: Error | InventoryError): string => {
  if (isInventoryError(error)) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return 'Errore di Validazione';
      case ERROR_CODES.BUSINESS_RULE_ERROR:
        return 'Regola di Business Violata';
      case ERROR_CODES.INSUFFICIENT_STOCK:
        return 'Stock Insufficiente';
      case ERROR_CODES.DUPLICATE_SERIAL:
        return 'Numero Seriale Duplicato';
      case ERROR_CODES.PRODUCT_NOT_FOUND:
        return 'Prodotto Non Trovato';
      case ERROR_CODES.UNIT_NOT_FOUND:
        return 'Unità Non Trovata';
      case ERROR_CODES.BARCODE_ERROR:
        return 'Errore Codice a Barre';
      case ERROR_CODES.DATABASE_ERROR:
        return 'Errore Database';
      case ERROR_CODES.PERMISSION_DENIED:
        return 'Accesso Negato';
      default:
        return 'Errore Inventario';
    }
  }
  return 'Errore Sistema';
};

const getSuggestedActions = (error: Error | InventoryError): string[] => {
  if (isInventoryError(error)) {
    switch (error.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return [
          'Controlla i dati inseriti',
          'Verifica che tutti i campi obbligatori siano compilati',
          'Assicurati che i formati siano corretti'
        ];
      case ERROR_CODES.INSUFFICIENT_STOCK:
        return [
          'Verifica la disponibilità del prodotto',
          'Riduci la quantità richiesta',
          'Controlla lo stock aggiornato'
        ];
      case ERROR_CODES.DUPLICATE_SERIAL:
        return [
          'Utilizza un numero seriale diverso',
          'Verifica che il seriale non sia già in uso',
          'Controlla l\'archivio dei prodotti venduti'
        ];
      case ERROR_CODES.BUSINESS_RULE_ERROR:
        return [
          'Rispetta le regole di business definite',
          'Controlla i limiti di prezzo',
          'Verifica le politiche aziendali'
        ];
      case ERROR_CODES.DATABASE_ERROR:
        return [
          'Riprova più tardi',
          'Controlla la connessione',
          'Contatta l\'assistenza se il problema persiste'
        ];
      default:
        return ['Controlla i dati e riprova'];
    }
  }
  return [
    'Ricarica la pagina',
    'Controlla la connessione internet',
    'Contatta l\'assistenza se necessario'
  ];
};

export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  error,
  context,
  className,
  showDetails = false
}) => {
  if (!error) return null;

  const severity = getErrorSeverity(error);
  const variant = getErrorVariant(severity);
  const Icon = getErrorIcon(severity);
  const title = getErrorTitle(error);
  const suggestedActions = getSuggestedActions(error);

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          {context && (
            <Badge variant="outline" className="text-xs">
              {context}
            </Badge>
          )}
        </div>
        
        <p className="text-sm">{error.message}</p>
        
        {showDetails && isInventoryError(error) && error.context && (
          <div className="text-xs bg-muted/50 p-2 rounded border">
            <strong>Dettagli:</strong>
            <pre className="mt-1 whitespace-pre-wrap">
              {JSON.stringify(error.context, null, 2)}
            </pre>
          </div>
        )}
        
        {suggestedActions.length > 0 && (
          <div className="text-xs space-y-1">
            <strong>Azioni suggerite:</strong>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryError, isInventoryError } from '@/services/inventory/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error
    console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show user-friendly toast
    if (isInventoryError(error)) {
      toast.error(`Errore Inventario: ${error.message}`);
    } else {
      toast.error('Si è verificato un errore imprevisto');
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    if (isInventoryError(error)) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return 'low';
        case 'BUSINESS_RULE_ERROR':
          return 'medium';
        case 'DATABASE_ERROR':
          return 'high';
        default:
          return 'medium';
      }
    }
    return 'high';
  };

  private getErrorTypeDisplay = (error: Error): string => {
    if (isInventoryError(error)) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return 'Errore di Validazione';
        case 'BUSINESS_RULE_ERROR':
          return 'Regola di Business';
        case 'DATABASE_ERROR':
          return 'Errore Database';
        case 'BARCODE_ERROR':
          return 'Errore Codice a Barre';
        default:
          return 'Errore Inventario';
      }
    }
    return 'Errore Sistema';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const severity = error ? this.getErrorSeverity(error) : 'high';
      const errorType = error ? this.getErrorTypeDisplay(error) : 'Errore Sconosciuto';

      return (
        <Card className="w-full max-w-2xl mx-auto border-destructive/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-destructive">
                Si è verificato un errore
              </CardTitle>
              <div className="flex justify-center gap-2">
                <Badge 
                  variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'default' : 'secondary'}
                >
                  {errorType}
                </Badge>
                {this.props.context && (
                  <Badge variant="outline">
                    {this.props.context}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Message */}
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                {error?.message || 'Errore sconosciuto'}
              </p>
              
              {isInventoryError(error) && error.context && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Dettagli:</strong> {JSON.stringify(error.context, null, 2)}
                </div>
              )}
            </div>

            {/* Error Details (if enabled) */}
            {this.props.showDetails && this.state.errorInfo && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  <Bug className="inline h-3 w-3 mr-1" />
                  Dettagli tecnici
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={this.handleRetry}
                className="flex-1"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Riprova
                {this.state.retryCount > 0 && ` (${this.state.retryCount}/3)`}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={this.handleReload}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Ricarica Pagina
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </div>

            {/* User Guidelines */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Cosa puoi fare:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Prova a ricaricare la pagina</li>
                <li>Controlla la tua connessione internet</li>
                <li>Se il problema persiste, contatta l'assistenza</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
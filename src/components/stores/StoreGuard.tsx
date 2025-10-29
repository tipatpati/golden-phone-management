import React from 'react';
import { useStore } from '@/contexts/store/StoreContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Store, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StoreGuardProps {
  children: React.ReactNode;
}

/**
 * StoreGuard ensures that the store context is properly initialized
 * before rendering protected components. It displays loading states
 * and error messages as needed.
 */
export function StoreGuard({ children }: StoreGuardProps) {
  const { currentStore, userStores, isLoading, error } = useStore();

  // Show loading state while stores are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex flex-col items-center gap-4">
          <Store className="h-12 w-12 text-primary animate-pulse" />
          <LoadingSpinner />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">
              Caricamento Negozi
            </h2>
            <p className="text-sm text-muted-foreground">
              Caricamento delle informazioni del negozio in corso...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error with actionable guidance
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore Inizializzazione Negozio</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Il contesto del negozio non può essere inizializzato. Possibili cause:</p>
            <ul className="list-disc ml-4 space-y-1 text-sm">
              <li>Non sei assegnato a nessun negozio</li>
              <li>Problemi di connettività di rete</li>
              <li>Problemi di configurazione del database</li>
            </ul>
            <div className="text-xs bg-surface-container p-2 rounded font-mono">
              <strong>Dettagli errore:</strong> {error.message}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Ricarica Pagina
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                Torna alla Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error if user has no stores assigned
  if (!isLoading && userStores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <Store className="h-4 w-4" />
          <AlertTitle>Nessun Negozio Assegnato</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Il tuo account non ha negozi assegnati. Contatta l'amministratore
              per ottenere l'accesso a un negozio.
            </p>
            <Button
              onClick={() => window.location.href = '/profile'}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              Vai al Profilo
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show error if store context is not initialized
  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contesto Negozio Non Impostato</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Il sistema non ha potuto determinare il negozio attivo.</p>
            <p className="text-sm">Questo può accadere se:</p>
            <ul className="list-disc ml-4 space-y-1 text-sm">
              <li>La sessione è stata persa o è scaduta</li>
              <li>Non hai i permessi necessari per accedere ai negozi</li>
              <li>C'è un problema temporaneo con il database</li>
            </ul>
            <div className="flex gap-2 mt-4">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Ricarica Pagina
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                Torna alla Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Store context is ready, render children
  return <>{children}</>;
}

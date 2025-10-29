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

  // Show error if there was a problem loading stores
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore di Caricamento</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Si è verificato un errore durante il caricamento dei negozi.
            </p>
            <p className="text-xs font-mono">
              {error.message || 'Errore sconosciuto'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Ricarica la Pagina
            </Button>
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

  // Show error if store context is not initialized (currentStore is null)
  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Contesto Negozio Non Impostato</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Il contesto del negozio non è stato inizializzato. Per favore
              ricarica la pagina.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Ricarica la Pagina
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Store context is ready, render children
  return <>{children}</>;
}

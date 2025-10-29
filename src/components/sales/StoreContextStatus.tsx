import React from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStore } from '@/contexts/store/StoreContext';

export function StoreContextStatus() {
  const { currentStore, isLoading, error } = useStore();

  // Show loading state
  if (isLoading) {
    return (
      <Alert className="bg-surface-container border-border">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertTitle>Caricamento contesto negozio...</AlertTitle>
        <AlertDescription>
          Inizializzazione in corso
        </AlertDescription>
      </Alert>
    );
  }

  // Show error state
  if (error || !currentStore) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Contesto Negozio Non Impostato</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            Il contesto del negozio non è stato inizializzato. Per favore ricarica la pagina.
            {error && <span className="block text-xs mt-1">Errore: {error.message}</span>}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Ricarica
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show success state (minimally)
  return (
    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200">
        Contesto Negozio: {currentStore.name}
      </AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-300 text-xs">
        Sistema pronto per le vendite
      </AlertDescription>
    </Alert>
  );
}

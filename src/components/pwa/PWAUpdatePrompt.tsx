import React, { useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

export function PWAUpdatePrompt() {
  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast.info('Aggiornamento Disponibile', {
          description: 'L\'app è stata aggiornata. Ricarica la pagina per applicare le modifiche.',
          action: {
            label: 'Ricarica',
            onClick: () => window.location.reload(),
          },
          duration: Infinity,
        });
      });
    }
  }, []);

  return null;
}

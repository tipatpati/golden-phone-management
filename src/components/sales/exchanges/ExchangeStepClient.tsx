import React from 'react';
import { Label } from '@/components/ui/label';
import { SimpleClientSelector } from '../SimpleClientSelector';

interface ExchangeStepClientProps {
  clientId?: string;
  onClientChange: (clientId?: string) => void;
}

export function ExchangeStepClient({
  clientId,
  onClientChange,
}: ExchangeStepClientProps) {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Seleziona Cliente</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Il cliente è opzionale. Puoi procedere senza selezionare un cliente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Cliente (Opzionale)</Label>
        <SimpleClientSelector
          value={clientId}
          onChange={onClientChange}
          placeholder="Seleziona cliente..."
        />
      </div>
    </div>
  );
}

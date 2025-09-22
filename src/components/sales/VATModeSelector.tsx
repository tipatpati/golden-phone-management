import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';

interface VATModeSelectorProps {
  vatIncluded: boolean;
  onVATModeChange: (included: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function VATModeSelector({ vatIncluded, onVATModeChange, disabled, id = 'vat-mode' }: VATModeSelectorProps) {
  console.log('🎛️ VATModeSelector render - vatIncluded:', vatIncluded, 'disabled:', disabled);
  return (
    <div className="border border-border/30 rounded-lg bg-surface-container p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <div>
            <Label className="text-sm font-medium text-on-surface">
              Modalità IVA
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vatIncluded 
                ? 'I prezzi includono IVA (22%)' 
                : 'I prezzi escludono IVA (22%)'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={id} 
            className="text-xs text-muted-foreground"
          >
            {vatIncluded ? 'Inclusa' : 'Esclusa'}
          </Label>
          <Switch
            id={id}
            checked={vatIncluded}
            onCheckedChange={(checked) => {
              console.log('🎛️ Switch onCheckedChange - checked:', checked);
              onVATModeChange(checked);
            }}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

interface VATModeSelectorProps {
  vatIncluded: boolean;
  onVATModeChange: (included: boolean) => void;
  disabled?: boolean;
}

export function VATModeSelector({ vatIncluded, onVATModeChange, disabled }: VATModeSelectorProps) {
  return (
    <Card className="bg-surface-container border-border/30">
      <CardContent className="p-4">
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
              htmlFor="vat-mode" 
              className="text-xs text-muted-foreground"
            >
              {vatIncluded ? 'Inclusa' : 'Esclusa'}
            </Label>
            <Switch
              id="vat-mode"
              checked={vatIncluded}
              onCheckedChange={onVATModeChange}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
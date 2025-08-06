import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type BarcodeFormat = 'AUTO' | 'GTIN-13' | 'CODE128';

interface BarcodeFormatSelectorProps {
  value: BarcodeFormat;
  onChange: (format: BarcodeFormat) => void;
  className?: string;
}

const formatDescriptions = {
  'AUTO': 'Automatically selects the best format based on input (GTIN-13 for valid IMEI, CODE128 for others)',
  'GTIN-13': 'GS1-compliant 13-digit barcode ideal for retail and inventory systems',
  'CODE128': 'Flexible alphanumeric barcode supporting all ASCII characters and GS1 Application Identifiers'
};

export function BarcodeFormatSelector({ value, onChange, className }: BarcodeFormatSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label htmlFor="barcode-format">Barcode Format</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p className="font-medium">Barcode Format Guide:</p>
                <ul className="text-sm space-y-1">
                  <li><strong>AUTO:</strong> Smart selection based on input</li>
                  <li><strong>GTIN-13:</strong> Retail standard (EAN-13 compatible)</li>
                  <li><strong>CODE128:</strong> Industrial standard (flexible format)</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="barcode-format">
          <SelectValue placeholder="Select barcode format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AUTO">
            <div className="flex flex-col">
              <span>Auto-Detect</span>
              <span className="text-xs text-muted-foreground">Recommended</span>
            </div>
          </SelectItem>
          <SelectItem value="GTIN-13">
            <div className="flex flex-col">
              <span>GTIN-13 (EAN-13)</span>
              <span className="text-xs text-muted-foreground">Retail standard</span>
            </div>
          </SelectItem>
          <SelectItem value="CODE128">
            <div className="flex flex-col">
              <span>CODE128</span>
              <span className="text-xs text-muted-foreground">Industrial standard</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <p className="text-xs text-muted-foreground">
        {formatDescriptions[value]}
      </p>
    </div>
  );
}
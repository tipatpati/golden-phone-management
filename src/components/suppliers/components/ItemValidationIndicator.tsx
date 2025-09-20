import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { ItemValidationSummary } from '../hooks/useAcquisitionValidation';

interface ItemValidationIndicatorProps {
  summary: ItemValidationSummary;
  itemIndex: number;
}

export function ItemValidationIndicator({ summary, itemIndex }: ItemValidationIndicatorProps) {
  if (summary.isValid) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    );
  }

  const errorCount = summary.errors.length;
  let variant: "destructive" | "secondary" = "destructive";
  let icon = <XCircle className="w-3 h-3 mr-1" />;
  let text = `${errorCount} Error${errorCount !== 1 ? 's' : ''}`;

  if (summary.hasRequiredFieldErrors) {
    variant = "destructive";
    icon = <XCircle className="w-3 h-3 mr-1" />;
    text = "Required Fields Missing";
  } else if (summary.hasPricingErrors || summary.hasSerialErrors) {
    variant = "secondary";
    icon = <AlertTriangle className="w-3 h-3 mr-1" />;
    text = `${errorCount} Issue${errorCount !== 1 ? 's' : ''}`;
  }

  return (
    <Badge variant={variant} className={variant === "secondary" ? "bg-orange-100 text-orange-800 border-orange-200" : ""}>
      {icon}
      {text}
    </Badge>
  );
}
import React from 'react';
import type { ProductFormData } from '@/services/inventory/types';

interface FormDebuggerProps {
  formData: Partial<ProductFormData>;
  serialNumbers: string;
  errors: Array<{ field: string; message: string }>;
}

export function FormDebugger({ formData, serialNumbers, errors }: FormDebuggerProps) {
  // Only render in development mode to reduce production bundle size
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details className="mt-4 p-3 bg-muted rounded-lg text-xs">
      <summary className="font-semibold cursor-pointer">Debug Info</summary>
      <div className="mt-2 space-y-2">
        <div>
          <strong>Form Data:</strong>
          <pre className="mt-1 text-[10px] overflow-auto max-h-24 bg-background p-2 rounded">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Serial Numbers:</strong> "{serialNumbers}"
        </div>
        {errors.length > 0 && (
          <div>
            <strong>Validation Errors ({errors.length}):</strong>
            <ul className="mt-1 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-destructive">
                  {error.field}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
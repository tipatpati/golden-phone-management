import React from 'react';
import { ProductFormData } from './forms/types';

interface FormDebuggerProps {
  formData: Partial<ProductFormData>;
  serialNumbers: string;
  errors: Array<{ field: string; message: string }>;
}

export function FormDebugger({ formData, serialNumbers, errors }: FormDebuggerProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs space-y-2">
      <h4 className="font-semibold">Debug Info:</h4>
      <div>
        <strong>Form Data:</strong>
        <pre className="mt-1 text-[10px] overflow-auto max-h-32">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
      <div>
        <strong>Serial Numbers:</strong> "{serialNumbers}"
      </div>
      <div>
        <strong>Validation Errors ({errors.length}):</strong>
        {errors.length > 0 && (
          <ul className="mt-1 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-600">
                {error.field}: {error.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
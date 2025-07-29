import React from 'react';
import { toast } from 'sonner';
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';

interface ErrorToastProps {
  title: string;
  description?: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
}

const icons = {
  error: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

const colors = {
  error: 'text-destructive',
  warning: 'text-orange-600',
  success: 'text-green-600',
  info: 'text-blue-600',
};

export function showErrorToast({ title, description, type = 'error', duration = 5000 }: ErrorToastProps) {
  const Icon = icons[type];
  
  const content = (
    <div className="flex items-start gap-3">
      <Icon className={`h-5 w-5 mt-0.5 ${colors[type]}`} />
      <div className="flex-1 space-y-1">
        <div className="font-medium">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );

  switch (type) {
    case 'success':
      return toast.success(content, { duration });
    case 'warning':
      return toast.warning(content, { duration });
    case 'info':
      return toast.info(content, { duration });
    default:
      return toast.error(content, { duration });
  }
}

export function showNetworkError() {
  return showErrorToast({
    title: 'Connection Error',
    description: 'Please check your internet connection and try again.',
    type: 'error'
  });
}

export function showValidationError(field: string) {
  return showErrorToast({
    title: 'Validation Error',
    description: `Please check the ${field} field and try again.`,
    type: 'warning'
  });
}

export function showPermissionError() {
  return showErrorToast({
    title: 'Permission Denied',
    description: 'You do not have permission to perform this action.',
    type: 'error'
  });
}
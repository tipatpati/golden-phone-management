/**
 * Enhanced Error Boundary with Recovery and Reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { logger } from '@/utils/secureLogger';
import { errorTracking } from '@/services/core/ErrorTracking';
import { AppError } from '@/types/global';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  showDetails?: boolean;
  context?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: Set<NodeJS.Timeout> = new Set();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    const context = this.props.context || 'ErrorBoundary';
    logger.error('Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    }, context);

    // Track error for monitoring
    errorTracking.trackError(error, {
      component: context,
      action: 'component_error'
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    // Clean up retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      logger.warn('Max retries reached for error boundary', {
        retryCount: this.state.retryCount,
        maxRetries
      }, this.props.context);
      return;
    }

    logger.info('Retrying error boundary', {
      retryCount: this.state.retryCount + 1
    }, this.props.context);

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleAutoRetry = () => {
    // Auto-retry after 5 seconds for the first error
    if (this.state.retryCount === 0) {
      const timeout = setTimeout(() => {
        this.handleRetry();
        this.retryTimeouts.delete(timeout);
      }, 5000);
      this.retryTimeouts.add(timeout);
    }
  };

  private createAppError(): AppError {
    const error = new Error(this.state.error?.message || 'Component error') as AppError;
    error.code = 'COMPONENT_ERROR';
    error.context = {
      componentStack: this.state.errorInfo?.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    };
    error.severity = 'high';
    return error;
  }

  render() {
    if (this.state.hasError) {
      // Auto-retry setup
      this.handleAutoRetry();

      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;
      const appError = this.createAppError();

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            {this.props.showDetails && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({maxRetries - this.state.retryCount} left)
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Reload Page
              </Button>
            </div>

            {this.state.retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Retry attempt: {this.state.retryCount} of {maxRetries}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
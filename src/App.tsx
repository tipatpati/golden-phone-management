import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { logger } from "@/utils/secureLogger";

console.log('App.tsx: File loaded');

export default function App() {
  console.log('App.tsx: Component function executing...');
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Application error boundary triggered:', error);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    try {
      logger.error('Application error boundary triggered', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }, 'App');
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  console.log('App.tsx: About to render ErrorBoundary...');

  try {
    return (
      <ErrorBoundary onError={handleError}>
        <AppProviders includeAuth>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error during App render:', error);
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'Arial' }}>
        <h2>Critical App Error</h2>
        <p>Error: {error?.message || 'Unknown error'}</p>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {error?.stack || 'No stack trace available'}
        </pre>
      </div>
    );
  }
}
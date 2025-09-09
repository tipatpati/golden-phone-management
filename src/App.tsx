import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { logger } from "@/utils/logger";
import { bootstrapServices } from "@/services/core";
import { ServiceHealthDashboard } from "@/components/admin";

export default function App() {
  console.log('🚀 App component starting...');
  
  React.useEffect(() => {
    console.log('🎯 App mounted successfully');
    // Initialize enhanced service management system
    bootstrapServices().catch(console.error);
    return () => console.log('🔴 App unmounting');
  }, []);
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('💥 App Error Boundary triggered:', error);
    console.error('📋 Error Info:', errorInfo);
    logger.error('Application error boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'App');
  };

  try {
    return (
      <ErrorBoundary onError={handleError}>
        <AppProviders includeAuth>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('💥 App render error:', error);
    return <div>EMERGENCY FALLBACK: App failed to render</div>;
  }
}
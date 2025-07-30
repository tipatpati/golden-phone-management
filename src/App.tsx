
import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders includeAuth>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}

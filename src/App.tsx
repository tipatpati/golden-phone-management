
import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { PreviewDebugger } from "@/components/debug/PreviewDebugger";

export default function App() {
  // All iframe detection and security features disabled
  return (
    <AppProviders includeAuth>
      <PreviewDebugger />
      <AppRouter />
    </AppProviders>
  );
}

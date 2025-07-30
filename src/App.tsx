
import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";

export default function App() {
  return (
    <AppProviders includeAuth>
      <AppRouter />
    </AppProviders>
  );
}

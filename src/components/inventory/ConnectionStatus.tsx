
import React from "react";
import { ModuleNavCards } from "@/components/common/ModuleNavCards";

interface ConnectionStatusProps {
  canAddProducts: boolean;
  isCheckingConnection: boolean;
  onTestConnection: () => void;
}

export function ConnectionStatus({ 
  canAddProducts, 
  isCheckingConnection, 
  onTestConnection 
}: ConnectionStatusProps) {
  return <ModuleNavCards currentModule="inventory" />;
}

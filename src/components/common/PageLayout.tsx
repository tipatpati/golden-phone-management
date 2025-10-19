/**
 * Standardized Page Layout Container
 * Ensures consistent spacing, background, and structure across all modules
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface to-surface-container",
      "p-3 sm:p-4 lg:p-6",
      "scan-lines",
      className
    )}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {children}
      </div>
    </div>
  );
}
